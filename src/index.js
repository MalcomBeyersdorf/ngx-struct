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

  const serviceContent = `
    // Import statements etc.
    import { startWith, Subject, switchMap, of } from 'rxjs';
    import { computed, effect, inject, Injectable, signal } from '@angular/core';
    import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
    import { ${toPascalCase(name)}Store } from './${toKebabCase(name)}.store';
    
    @Injectable({
      providedIn: 'root',
    })
    export class ${toPascalCase(name)}Service {
        //private readonly apiService: ApiService = inject(ApiService);
        private readonly ${toCamelCase(name)}Store: ${toPascalCase(
          name,
        )}Store = inject(${toPascalCase(name)}Store);
        
        private state = signal<any>({
          data: [],
          status: 'loading',
          error: null,
        });
        
        data = computed(() => this.state().data);
        status = computed(() => this.state().status);
        error = computed(() => this.state().error);

        retry$ = new Subject<void>();
        private dataLoaded$ = this.retry$.pipe(
          startWith(null),
          switchMap(() =>
            of(console.log('api request'))
            /*
            this.apiService.get().pipe(
              retry({
                delay: error => {
                  this.state.update(state => ({ ...state, error, status: 'error' }));
                  return this.retry$;
                },
              }),
            ),
            */
          ),
        );
        action = new Subject<any>();
        
        constructor() {
          this.dataLoaded$.pipe(takeUntilDestroyed()).subscribe({
            next: (response: any) => {
            /*
              this.state.update(state => ({
                ...state,
                data: response.data,
                status: 'success',
              }));
            */
            },
            error: error => this.state.update(state => ({ ...state, error, status: 'error' })),
          });
      
          this.action.pipe(takeUntilDestroyed()).subscribe((subjectReceived: any) => {
            if (subjectReceived) {
              // do something
            } else {
              // do something
            }
          });
      
          this.retry$
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.state.update(state => ({ ...state, status: 'loading' })));
      
          effect(() => {
            if (this.state().status === 'success') {
              this.${toCamelCase(name)}Store.saveData(this.data());
            }
          });
        }
    }
  `;

  const storeContent = `
    import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';
    import { Observable, of } from 'rxjs';
    
    export const LOCAL_STORAGE = new InjectionToken<Storage>('window local storage object', {
      providedIn: 'root',
      factory: () => {
        return inject(PLATFORM_ID) === 'browser' ? window.localStorage : ({} as Storage);
      },
    });
    
    @Injectable({
      providedIn: 'root',
    })
    export class ${toPascalCase(name)}Store {
      storage = inject(LOCAL_STORAGE);
    
      loadData(): Observable<any[]> {
        const data = this.storage.getItem('${toCamelCase(name)}');
        return of(data ? (JSON.parse(data) as any[]) : []);
      }
    
      saveData(data: any[]): void {
        this.storage.setItem('data', JSON.stringify(data));
      }
    }
  `;

  fs.writeFileSync(
    path.join(basePath, "data", `${toKebabCase(name)}.service.ts`),
    serviceContent,
  );
  fs.writeFileSync(
    path.join(basePath, "data", `${toKebabCase(name)}.store.ts`),
    storeContent,
  );
}

function createComponentFiles(basePath, name) {
  createDirectories(basePath, ["feature"]);
  const componentTemplate = `<p>${name} works!</p>`;
  const componentContent = `
    import { Component, inject } from '@angular/core';
    import { ${toPascalCase(name)}Service } from '../data/${toKebabCase(
      name,
    )}.service';

    @Component({
      selector: 'app-${toKebabCase(name)}',
      standalone: true,
      template: \`${componentTemplate}\`,
    })
    export class ${toPascalCase(name)}Component {
      private readonly ${toCamelCase(name)}Service: ${toPascalCase(
        name,
      )}Service = inject(${toPascalCase(name)}Service);
    }
  `;

  fs.writeFileSync(
    path.join(basePath, "feature", `${toKebabCase(name)}.component.ts`),
    componentContent,
  );
}

function createRoutesFiles(basePath, name, childName) {
  const routesPath = path.join(basePath, `${toKebabCase(name)}.routes.ts`);
  if (fs.existsSync(routesPath)) {
    let data = fs.readFileSync(routesPath, "utf8");

    const newImport = `import { ${toPascalCase(childName)} } from './${toKebabCase(childName)}/feature/${toKebabCase(childName)}.component';\n`;
    const newRoute = `{
      path: '${toKebabCase(childName)}',
      component: ${toPascalCase(childName)}Component,
    },`;

    const importPosition =
      data.lastIndexOf("import") +
      data.substring(data.lastIndexOf("import")).indexOf(";\n") +
      2;
    const updatedImports =
      data.substring(0, importPosition) +
      newImport +
      data.substring(importPosition);

    const position = updatedImports.lastIndexOf("];");
    if (position !== -1) {
      const updatedData =
        updatedImports.substring(0, position) +
        newRoute +
        "\n  " +
        updatedImports.substring(position);

      fs.writeFileSync(routesPath, updatedData, "utf8");
    } else {
      console.error(`Error finding the ${toKebabCase(name)}.routes.ts file`);
    }
  } else {
    const componentContent = `
      import { Routes } from '@angular/router';
      import { ${toPascalCase(childName)} } from './${toKebabCase(childName)}/feature/${toKebabCase(childName)}.component';

      export const ${toScreamingSnakeCase(name)}_ROUTES: Routes = [
        {
          path: '',
          component: ${toPascalCase(childName)},
        },
      ];
    `;

    fs.writeFileSync(routesPath, componentContent, "utf8");
  }
}

function createStructure(name, basePath, isNested, childName = null) {
  if (isNested) {
    const childBasePath = path.join(basePath, childName);
    createDirectories(childBasePath, ["data", "ui", "feature"]);
    createComponentFiles(childBasePath, childName);
    createServiceAndStoreFiles(childBasePath, childName);
    createRoutesFiles(basePath, name, childName);
  } else {
    createDirectories(basePath, ["data", "ui", "feature"]);
    createServiceAndStoreFiles(basePath, name);
    createComponentFiles(basePath, name);
  }
}

rl.question("Name feature (camelCase): ", (parentName) => {
  rl.question("Multiple routes? (y/n): ", (nestedAnswer) => {
    const isNested = nestedAnswer.trim().toLowerCase() === "y";
    const basePath = path.join("./src/app", parentName);

    if (isNested) {
      rl.question("Name feature/route: ", (childName) => {
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

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toKebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function toScreamingSnakeCase(str) {
  return str
    .replace(/\s+/g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toUpperCase();
}
