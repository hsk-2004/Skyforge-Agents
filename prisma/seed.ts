// Database seed script: imports agents from spreadsheets in the project root.
// Handles two sources — a base agents file (agents.xlsx/agents.csv) and an
// AON network file (AON.xlsx with Members and Affiliates sheets).
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// Connect to Turso through the libSQL driver adapter (same as the app)
const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const rootDir = path.join(__dirname, '..');
  
  // 1. Seed base agents (agents.xlsx or agents.csv) if present
  // Prefer the .xlsx file; fall back to .csv when it doesn't exist
  let baseAgentsFilePath = path.join(rootDir, 'agents.xlsx');
  if (!fs.existsSync(baseAgentsFilePath)) {
    baseAgentsFilePath = path.join(rootDir, 'agents.csv');
  }

  let baseAgentsCount = 0;
  if (fs.existsSync(baseAgentsFilePath)) {
    console.log(`Loading base agents from: ${baseAgentsFilePath}`);
    const workbook = XLSX.readFile(baseAgentsFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert worksheet to JSON array of objects
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Parsed ${rawData.length} rows from base agents sheet.`);

    if (rawData.length > 0) {
      // Clear existing non-AON agents to avoid duplicates
      console.log('Clearing existing non-AON agents...');
      await prisma.agent.deleteMany({
        where: {
          OR: [
            { networks: { not: 'AON' } },
            { networks: null }
          ]
        }
      });

      console.log('Inserting base agents into database...');
      const baseAgents = rawData.map((row: any) => {
        // Look up a cell by trying several possible header names
        // (case-insensitive, ignoring surrounding whitespace)
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
        
        const ratingRaw = findValue(['Rating']);
        const rating = ratingRaw ? parseFloat(ratingRaw) : null;
        const coverage = findValue(['Coverage']);
        const operation = findValue(['Operation']);
        const transportMode = findValue(['Transport Mode', 'TransportMode']);
        const services = findValue(['Services']);
        const contacts = findValue(['Contacts']);
        const segments = findValue(['Segments']);
        const networks = findValue(['Networks']);

        // Normalize everything to strings/nulls to match the Prisma schema
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

      // Insert in chunks of 100 to keep each query small
      const chunkSize = 100;
      for (let i = 0; i < baseAgents.length; i += chunkSize) {
        const chunk = baseAgents.slice(i, i + chunkSize);
        await prisma.agent.createMany({
          data: chunk,
        });
      }
      baseAgentsCount = baseAgents.length;
      console.log(`Successfully seeded ${baseAgentsCount} base agents into the database.`);
    }
  } else {
    console.log('No base agents spreadsheet (agents.xlsx / agents.csv) found. Skipping base agents seeding (existing base agents in DB will be preserved).');
  }

  // 2. Seed AON agents (AON.xlsx) if present
  const aonFilePath = path.join(rootDir, 'AON.xlsx');
  let aonAgentsCount = 0;

  if (fs.existsSync(aonFilePath)) {
    console.log(`Loading AON agents from: ${aonFilePath}`);
    const workbook = XLSX.readFile(aonFilePath);
    
    // Clear existing AON agents to avoid duplicates
    console.log('Clearing existing AON agents...');
    await prisma.agent.deleteMany({
      where: {
        networks: 'AON'
      }
    });

    const aonAgentsToInsert: any[] = [];

    // Process Sheet 1: Members
    const memberSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('member'));
    if (memberSheetName) {
      const worksheet = workbook.Sheets[memberSheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`Parsed ${rawRows.length} raw rows from AON member sheet.`);

      // Row 0: Title, Row 1: Title or empty, Row 2: Headers (City, Company, First Name, Last Name, E-mail, Phone)
      // Row 3 is the start of the data.
      // The sheet only writes the country on the first row of each group,
      // so carry the last seen country forward for the rows below it.
      let currentCountry = '';

      for (let i = 3; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        let country = row[0] ? String(row[0]).trim() : '';
        const city = row[1] ? String(row[1]).trim() : '';
        const company = row[2] ? String(row[2]).trim() : '';
        const firstName = row[3] ? String(row[3]).trim() : '';
        const lastName = row[4] ? String(row[4]).trim() : '';
        const email = row[5] ? String(row[5]).trim() : '';
        const phone = row[6] ? String(row[6]).trim() : '';

        // If company and city are both empty, skip (e.g. empty rows or legend at bottom)
        if (!company && !city) continue;

        // Propagate country if it's blank in this cell
        if (country) {
          currentCountry = country;
        } else {
          country = currentCountry;
        }

        // Combine contact fields into a comma-separated list of non-empty parts
        const contactParts = [];
        if (firstName || lastName) {
          contactParts.push([firstName, lastName].filter(Boolean).join(' '));
        }
        if (email) contactParts.push(email);
        if (phone) contactParts.push(phone);
        const contactsStr = contactParts.map(part => part.trim()).filter(Boolean).join(',');

        aonAgentsToInsert.push({
          company: company || 'Unknown AON Agent',
          financialStatus: 'Excellent',
          fullAddress: city ? `${city}, ${country}` : country || 'Unknown Country',
          city: city || null,
          country: country || 'Unknown Country',
          rating: null,
          coverage: null,
          operation: null,
          transportMode: null,
          services: null,
          contacts: contactsStr || null,
          segments: null,
          networks: 'AON',
        });
      }
    }

    // Process Sheet 2: Affiliates
    const affiliateSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('affiliate'));
    if (affiliateSheetName) {
      const worksheet = workbook.Sheets[affiliateSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
      console.log(`Parsed ${rawData.length} rows from AON affiliates sheet.`);

      for (const row of rawData) {
        // Affiliates sheet has proper headers, so cells can be read by name
        const country = row['Country'] ? String(row['Country']).trim() : 'Unknown Country';
        const city = row['City'] ? String(row['City']).trim() : null;
        const company = row['Company'] ? String(row['Company']).trim() : null;
        const firstName = row['First Name'] ? String(row['First Name']).trim() : '';
        const lastName = row['Last Name'] ? String(row['Last Name']).trim() : '';
        const email = row['E-mail'] ? String(row['E-mail']).trim() : '';

        if (!company) continue; // Skip rows without a company name

        // Combine name and e-mail into the comma-separated contacts string
        const contactParts = [];
        if (firstName || lastName) {
          contactParts.push([firstName, lastName].filter(Boolean).join(' '));
        }
        if (email) contactParts.push(email);
        const contactsStr = contactParts.map(part => part.trim()).filter(Boolean).join(',');

        aonAgentsToInsert.push({
          company,
          financialStatus: 'Excellent',
          fullAddress: city ? `${city}, ${country}` : country,
          city,
          country,
          rating: null,
          coverage: null,
          operation: null,
          transportMode: null,
          services: null,
          contacts: contactsStr || null,
          segments: null,
          networks: 'AON',
        });
      }
    }

    if (aonAgentsToInsert.length > 0) {
      console.log(`Inserting ${aonAgentsToInsert.length} AON agents into database...`);
      // Insert in chunks of 100, same as the base agents
      const chunkSize = 100;
      for (let i = 0; i < aonAgentsToInsert.length; i += chunkSize) {
        const chunk = aonAgentsToInsert.slice(i, i + chunkSize);
        await prisma.agent.createMany({
          data: chunk,
        });
      }
      aonAgentsCount = aonAgentsToInsert.length;
      console.log(`Successfully seeded ${aonAgentsCount} AON agents into the database.`);
    }
  } else {
    console.log('No AON.xlsx spreadsheet found in root. Skipping AON agents seeding.');
  }

  // 3. Seed scraped agents (mapper-scraped.xlsx) if present
  const mapperFilePath = path.join(rootDir, 'mapper-scraped.xlsx');
  let mapperAgentsCount = 0;

  if (fs.existsSync(mapperFilePath)) {
    console.log(`Loading scraped agents from: ${mapperFilePath}`);
    const workbook = XLSX.readFile(mapperFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Parsed ${rawData.length} rows from scraped agents sheet.`);

    // Build a set of company+country keys already in the DB to skip duplicates
    const existing = await prisma.agent.findMany({ select: { company: true, country: true } });
    const existingKeys = new Set(existing.map(a => `${a.company.toLowerCase()}|${a.country.toLowerCase()}`));

    const mapperAgents: any[] = [];
    for (const row of rawData) {
      const company = row['Agent'] ? String(row['Agent']).trim() : '';
      const country = row['Country'] ? String(row['Country']).trim() : 'Unknown Country';
      if (!company) continue; // skip rows without a company name

      // Skip rows already present (from earlier seeds or previous runs)
      const key = `${company.toLowerCase()}|${country.toLowerCase()}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);

      // Office looks like "Country, City" — take the part after the comma as city
      const office = row['Office'] ? String(row['Office']).trim() : '';
      const officeParts = office.split(',').map((p: string) => p.trim()).filter(Boolean);
      const city = officeParts.length > 1 ? officeParts.slice(1).join(', ') : null;

      // Combine contact name, email and phone into the comma-separated contacts string
      const contactParts = [row['Contact'], row['Email'], row['Phone']]
        .map(v => (v ? String(v).trim() : ''))
        .filter(Boolean);

      mapperAgents.push({
        company,
        financialStatus: null,
        fullAddress: office || null,
        city,
        country,
        rating: null,
        coverage: row['Coverage'] ? String(row['Coverage']).trim() : null,
        operation: row['Operation'] ? String(row['Operation']).trim() : null,
        transportMode: row['TransportMode'] ? String(row['TransportMode']).trim() : null,
        services: row['Services'] ? String(row['Services']).trim() : null,
        contacts: contactParts.join(',') || null,
        segments: row['Segments'] ? String(row['Segments']).trim() : null,
        networks: row['Networks'] ? String(row['Networks']).trim() : null,
      });
    }

    if (mapperAgents.length > 0) {
      console.log(`Inserting ${mapperAgents.length} scraped agents into database...`);
      // Insert in chunks of 100, same as the other sources
      const chunkSize = 100;
      for (let i = 0; i < mapperAgents.length; i += chunkSize) {
        await prisma.agent.createMany({ data: mapperAgents.slice(i, i + chunkSize) });
      }
      mapperAgentsCount = mapperAgents.length;
      console.log(`Successfully seeded ${mapperAgentsCount} scraped agents into the database.`);
    } else {
      console.log('No new scraped agents to insert (all rows already exist in the database).');
    }
  } else {
    console.log('No mapper-scraped.xlsx spreadsheet found in root. Skipping scraped agents seeding.');
  }

  console.log('\n============================================================');
  console.log('Seeding completed successfully!');
  if (baseAgentsCount > 0) console.log(` - Base agents seeded: ${baseAgentsCount}`);
  if (aonAgentsCount > 0) console.log(` - AON agents seeded: ${aonAgentsCount}`);
  if (mapperAgentsCount > 0) console.log(` - Scraped agents seeded: ${mapperAgentsCount}`);
  console.log('============================================================\n');
}

// Run the seed; exit non-zero on failure and always close the DB connection
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
