import { PrismaClient, Role, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create Users
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            role: Role.ADMIN,
        },
    });

    const company = await prisma.user.upsert({
        where: { email: 'company@example.com' },
        update: {},
        create: {
            email: 'company@example.com',
            role: Role.COMPANY,
        },
    });

    const user = await prisma.user.upsert({
        where: { email: 'user@example.com' },
        update: {},
        create: {
            email: 'user@example.com',
            role: Role.USER,
        },
    });

    // Create an Application
    await prisma.application.create({
        data: {
            title: 'Senior Full Stack Engineer',
            candidateName: 'John Doe',
            candidateEmail: 'john.doe@example.com',
            status: ApplicationStatus.APPLIED,
            userId: admin.id,
        },
    });

    console.log('Seed data created successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
