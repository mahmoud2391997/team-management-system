import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  const existingTeam = await prisma.team.findFirst()
  if (existingTeam) {
    console.log(`Team already exists: ${existingTeam.name}`)
    console.log('Skipping seed.')
    return
  }

  const admin = await prisma.profile.findFirst({
    where: { role: 'ADMIN' },
  })

  if (!admin) {
    console.log('No admin profile found. Creating one...')
    const newAdmin = await prisma.profile.create({
      data: { id: 'owner-001', email: 'admin@teamhub.com', firstName: 'Admin', lastName: 'Owner', role: 'ADMIN' },
    })
    const team = await prisma.team.create({ data: { name: 'Default Team', ownerId: newAdmin.id } })
    await prisma.profile.update({ where: { id: newAdmin.id }, data: { teamId: team.id } })
    await prisma.department.create({ data: { name: 'Engineering', icon: 'code', managerId: newAdmin.id, teamId: team.id } })
    console.log(`Created team: ${team.name}, Owner: ${newAdmin.email}`)
  } else {
    const team = await prisma.team.create({ data: { name: 'Default Team', ownerId: admin.id } })
    await prisma.profile.update({ where: { id: admin.id }, data: { teamId: team.id } })
    await prisma.department.create({ data: { name: 'Engineering', icon: 'code', managerId: admin.id, teamId: team.id } })
    console.log(`Created team: ${team.name}, Owner: ${admin.email}`)
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
