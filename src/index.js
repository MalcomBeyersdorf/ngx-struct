#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function createDirectories(basePath, folders) {
  folders.forEach((folder) => {
    const folderPath = path.join(basePath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  });
}

function createServiceAndStoreFiles(basePath, name) {
  createDirectories(basePath, ["data"]);
  const serviceName = `${name.charAt(0).toUpperCase() + name.slice(1)}Service`;
  const storeName = `${name.charAt(0).toUpperCase() + name.slice(1)}Store`;

  const serviceContent = `
    // Import statements etc.
    export class ${serviceName} {
      // Service implementation
    }
  `;

  const storeContent = `
    // Import statements etc.
    export class ${storeName} {
      // Store implementation
    }
  `;

  fs.writeFileSync(
    path.join(basePath, "data", `${name.toLowerCase()}.service.ts`),
    serviceContent,
  );
  fs.writeFileSync(
    path.join(basePath, "data", `${name.toLowerCase()}.store.ts`),
    storeContent,
  );
}

function createComponentFiles(basePath, name) {
  createDirectories(basePath, ["feature"]);
  const componentTemplate = `<p>${name} works!</p>`;
  const componentName = `
    ${name.charAt(0).toUpperCase() + name.slice(1)}Component
  `;
  const componentContent = `
    import { Component } from '@angular/core';

    @Component({
      selector: 'app-${name.toLowerCase()}',
      template: \`${componentTemplate}\`,
      styleUrls: ['./${name.toLowerCase()}.component.scss']
    })
    export class ${componentName} {}
  `;

  fs.writeFileSync(
    path.join(basePath, "feature", `${name.toLowerCase()}.component.ts`),
    componentContent,
  );
  fs.writeFileSync(
    path.join(basePath, "feature", `${name.toLowerCase()}.component.html`),
    componentTemplate,
  );
  fs.writeFileSync(
    path.join(basePath, "feature", `${name.toLowerCase()}.component.scss`),
    "",
  );
}

function createStructure(name, basePath, isNested, childName = null) {
  const folders = ["data", "ui"];
  if (!isNested) {
    folders.push("feature");
  }

  createDirectories(basePath, folders);
  createServiceAndStoreFiles(basePath, name);
  if (!isNested) {
    createComponentFiles(basePath, name);
  }

  if (isNested && childName) {
    const childBasePath = path.join(basePath, "feature", childName);
    createDirectories(childBasePath, ["data", "ui", "feature"]);
    createComponentFiles(childBasePath, childName);
    createServiceAndStoreFiles(childBasePath, childName);
  }
}

rl.question("Name the folder & feature: ", (parentName) => {
  rl.question("Is it a nested component? (y/n): ", (nestedAnswer) => {
    const isNested = nestedAnswer.trim().toLowerCase() === "y";
    const basePath = path.join("./src/app", parentName);

    if (isNested) {
      rl.question("Name of the child component: ", (childName) => {
        createStructure(parentName, basePath, isNested, childName);
        console.log(
          `Structure for '${parentName}' with nested '${childName}' created successfully.`,
        );
        rl.close();
      });
    } else {
      createStructure(parentName, basePath, isNested);
      console.log(`Structure for '${parentName}' created successfully.`);
      rl.close();
    }
  });
});
