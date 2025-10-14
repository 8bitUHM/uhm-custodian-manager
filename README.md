# **UHM Custodian Manager**

Internal UH Mānoa Office of Human Resources app to manage and distribute custodial work assignments evenly.

## **Table of Contents**
1. [Project Structure](#project-structure)
2. [How to run the app](#how-to-run-the-app)
3. [Adding a new route entry point](#adding-a-new-route-entry-point)
4. [Learn More](#learn-more)

---

## **Project Structure**

TBA

## **How to run the app**

### **Prerequisites**
Ensure you have node installed. You can check whether you have node.js with:

```sh
node -v
npm -v
```

Both commands should print a version number. If a version number is not printed or node has not been installed, download and install it from [here](https://nodejs.org/en/download)

---

### **Setup Instructions**
1. **Clone the repository**  
   Open a terminal and run:

   ```sh
   git clone https://github.com/8bitUHM/uhm-custodian-manager.git
   cd uhm-custodian-manager
   ```
2. **Install dependencies**  
   ```sh
   npm install
   ```
3. Start the development server:
    ```sh
    npm run dev
    ```
4. Open the application in your browser:

   - By default, the development server runs on `http://localhost:3000`.

---
## Adding a new route entry point
1. **Make a new folder of what the page will be in the app folder**
2.	**Make a tsx file that's named "page.tsx" in the same folder that you created**
3.	**Add your content on there**
4.	**Whatever is the folder name will represent the link name**
ex: If i make a folder named "about-me" and I make a page.tsx in the "about-me" folder, the link that will show the content within the same folder will be localhost:3000/about-me

---
## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

To learn more about Prisma, look at the following resources:

- [Prisma Documentation](https://www.prisma.io/docs/) - learn about Prisma's ORM features.
- [How to use Prisma ORM with Next.js](https://www.prisma.io/docs/guides/nextjs) - learn the basics of using Prisma ORM with Next.js, Typescript, React, and PostgreSQL. 

### **License**
This project is maintained by ***8bit***.
