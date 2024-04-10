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
  const serviceNameUpperCase = `${name.charAt(0).toUpperCase() + name.slice(1)}Service`;
  const storeNameUpperCase = `${name.charAt(0).toUpperCase() + name.slice(1)}Store`;
  const storeNameLowerCase = `${name.charAt(0) + name.slice(1)}Store`;

  const serviceContent = `
    // Import statements etc.
    import { retry, startWith, Subject, switchMap } from 'rxjs';
    import { computed, effect, inject, Injectable, signal } from '@angular/core';
    import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
    
    @Injectable({
      providedIn: 'root',
    })
    export class ${serviceNameUpperCase} {
        //private readonly apiService: ApiService = inject(ApiService);
        private readonly ${storeNameLowerCase}: ${storeNameUpperCase} = inject(${storeNameUpperCase});
        
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
            console.log('api request');
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
            next: response => {
              this.state.update(state => ({
                ...state,
                data: response.data,
                status: 'success',
              }));
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
              this.${storeNameLowerCase}.saveData(this.data());
            }
          });
        }
    }
  `;

  const storeContent = `
    import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';
    import { of } from 'rxjs';
    
    export const LOCAL_STORAGE = new InjectionToken<Storage>('window local storage object', {
      providedIn: 'root',
      factory: () => {
        return inject(PLATFORM_ID) === 'browser' ? window.localStorage : ({} as Storage);
      },
    });
    
    @Injectable({
      providedIn: 'root',
    })
    export class ${storeNameUpperCase} {
      storage = inject(LOCAL_STORAGE);
    
      loadData(): Observable<any[]> {
        const data = this.storage.getItem('data');
        return of(data ? (JSON.parse(data) as data[]) : []);
      }
    
      saveData(data: any[]): void {
        this.storage.setItem('data', JSON.stringify(data));
      }
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
  const serviceNameUpperCase = `${name.charAt(0).toUpperCase() + name.slice(1)}Service`;
  const serviceNameLowerCase = `${name.charAt(0) + name.slice(1)}Service`;
  const componentTemplate = `<p>${name} works!</p>`;
  const componentName = `
    ${name.charAt(0).toUpperCase() + name.slice(1)}Component
  `;
  const componentContent = `
    import { Component } from '@angular/core';

    @Component({
      selector: 'app-${name.toLowerCase()}',
      standalone: true,
      template: \`${componentTemplate}\`,
    })
    export class ${componentName} {
      private readonly ${serviceNameLowerCase}: ${serviceNameUpperCase} = inject(${serviceNameUpperCase});
}
  `;

  fs.writeFileSync(
    path.join(basePath, "feature", `${name.toLowerCase()}.component.ts`),
    componentContent,
  );
}

function createRoutesFiles(name, basePath) {
  const routesNameLowerCase = `${name.charAt(0).toUpperCase() + name.slice(1)}Routes`;

  const componentContent = `
    import { Routes } from '@angular/router';

    export const ${routesNameLowerCase}: Routes = [
    /* NOTE: Add your routes here
      {
        path: '/',
        component: SomeComponent,
      },
      */
    ];
  `;

  fs.writeFileSync(
      path.join(basePath, "feature", `${name.toLowerCase()}.routes.ts`),
      componentContent,
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
    createRoutesFiles(childBasePath, childName);
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
