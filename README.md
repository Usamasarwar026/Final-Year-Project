# HotelGen: Smart Hotel Website Auto-Generator

This Project Build a Hotel related websites 

## Live Demo

 **[Visit Live Demo](https://smarthotelgen.vercel.app)**

# Folders
## basic-hotel-template
 This folder contain a templates for basic tier 

 ## smart-hotel-template
 This folder contain a template for Intermediate & Advance tier

 ## smart-hotel-website-auto-generator
 This is a main folder for project this is a starting point of website to generate hotel website 
 Enter in this folder and run the project by follow these commands that given in installation section

## Features

- Create a tier based hotel 
- Baisc Tier | Intermediate Tier | Advance Tier
- Put some details like website name, and admin credentials for generated website
- Generate a zip folder in next js

## Tech Stack

### Frontend
- Next.js 16
- TypeScript
- Tailwind CSS

### Backend
- Node js
- Prisma ORM
- PostgreSQL

### Authentication
- NextAuth.js

### Other Libraries
- Yup
- Tenstack react query
- Axios


## Installation

### Clone the repository.

```bash
git clone https://github.com/usamasarwar026/Final-Year-Project.git
```

### Move into the main project.

```bash
cd Final-Year-Project
```
```bash
cd smart-hotel-website-auto-generator
```

### Install dependencies.

```bash
npm install
```

### Environment Variables

Create a `.env` file.

```env
DATABASE_URL=

NEXTAUTH_URL="http://localhost:3000"

NEXTAUTH_SECRET=

EMAIL_USER=
EMAIL_PASS=
```

### Run Prisma migrations.

```bash
npx prisma migrate dev
```

### Generate Prisma Client.

```bash
npx prisma generate
```

### Start the development server.

```bash
npm run dev
```

## Usage

Open the browser.

```
http://localhost:3000
```

Login with your credentials.


## Database

Database used:

- PostgreSQL

ORM:

- Prisma

Generate Prisma client:

```bash
npx prisma generate
```

Run migration:

```bash
npx prisma migrate dev
```

## Authors

Muhammad Usama Sarwar

Muhammad Awais Ramzan

## ⭐ Support

If you found this project helpful, please give it a star on GitHub.
