import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  // Look for agents.xlsx or agents.csv in the root folder
  const rootDir = path.join(__dirname, '..');
  let filePath = path.join(rootDir, 'agents.xlsx');
  
  if (!fs.existsSync(filePath)) {
    filePath = path.join(rootDir, 'agents.csv');
  }

  if (!fs.existsSync(filePath)) {
    console.error('\n============================================================');
    console.error('ERROR: Database seeding failed!');
    console.error('Please place your spreadsheet in the project root folder as:');
    console.error(` - ${path.join(rootDir, 'agents.xlsx')} (Excel format)`);
    console.error('   OR');
    console.error(` - ${path.join(rootDir, 'agents.csv')} (CSV format)`);
    console.error('============================================================\n');
    process.exit(1);
  }

  console.log(`Loading database data from: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert worksheet to JSON array of objects
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
  console.log(`Parsed ${rawData.length} rows from the sheet.`);

  if (rawData.length === 0) {
    console.log('No data found in the spreadsheet.');
    return;
  }

  // Clear the existing database to avoid duplicates
  console.log('Clearing database...');
  await prisma.agent.deleteMany({});

  // Map and insert data
  console.log('Inserting agents into database...');
  const agents = rawData.map((row: any) => {
    // Normalise column names since they might have different cases/spaces
    const findValue = (keys: string[]) => {
      for (const key of keys) {
        const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key.toLowerCase());
        if (foundKey) return row[foundKey];
      }
      return null;
    };

    const company = findValue(['Company', 'Agent', 'Name']) || 'Unknown Agent';
    const financialStatus = findValue(['Financial status', 'FinancialStatus', 'Status']);
    const fullAddress = findValue(['Full address', 'FullAddress', 'Address']);
    const city = findValue(['City']);
    const country = findValue(['Country']) || 'Unknown Country';
    
    // UI fields
    const ratingRaw = findValue(['Rating']);
    const rating = ratingRaw ? parseFloat(ratingRaw) : null;
    const coverage = findValue(['Coverage']);
    const operation = findValue(['Operation']);
    const transportMode = findValue(['Transport Mode', 'TransportMode']);
    const services = findValue(['Services']);
    const contacts = findValue(['Contacts']);
    const segments = findValue(['Segments']);
    const networks = findValue(['Networks']);

    return {
      company: String(company),
      financialStatus: financialStatus ? String(financialStatus) : null,
      fullAddress: fullAddress ? String(fullAddress) : null,
      city: city ? String(city) : null,
      country: String(country),
      rating,
      coverage: coverage ? String(coverage) : null,
      operation: operation ? String(operation) : null,
      transportMode: transportMode ? String(transportMode) : null,
      services: services ? String(services) : null,
      contacts: contacts ? String(contacts) : null,
      segments: segments ? String(segments) : null,
      networks: networks ? String(networks) : null,
    };
  });

  // Batch insert in chunks to prevent database transaction limits
  const chunkSize = 100;
  for (let i = 0; i < agents.length; i += chunkSize) {
    const chunk = agents.slice(i, i + chunkSize);
    await prisma.agent.createMany({
      data: chunk,
    });
  }

  console.log(`Successfully seeded ${agents.length} agents into the database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
