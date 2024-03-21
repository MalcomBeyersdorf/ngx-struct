# Ngx Struct

Ngx Struc is a command-line interface tool designed to streamline the process of setting up new feature structures within Angular projects. By automating the creation of commonly used directory structures and files, this tool significantly reduces the time and effort involved in the initial setup of features, services, and stores in Angular applications.

## Features

- **Interactive Scaffold Creation:** Promptly generates a customizable structure for your Angular feature, including essential directories and files.
- **Configurable Components:** Based on user input, it creates a feature component with the option of marking it as standalone or nested within another feature.
- **Service and Store Generation:** Automatically generates service and store files within the `data` directory, pre-populated with template code for state management and data handling, leveraging RxJS for reactive data services.
- **Easy Integration:** Designed to be seamlessly integrated into existing Angular projects, enhancing development workflows without disrupting the current architecture.

## How It Works

Upon execution, Ngx Struct prompts the user for the name of the new feature. It then creates a dedicated folder for the feature, subdividing it into `data`, `feature`, and `ui` directories. The `data` directory gets populated with a service and a store file, each containing boilerplate code to kickstart development. Depending on user preference, it either creates a new Angular component within the `feature` directory or leaves it empty for nested features, streamlining the development process for both standalone and nested components.

## Getting Started

This CLI tool is designed to be installed globally and used within any Angular project to facilitate rapid development setup and consistent code organization.

### Installation

To install the Angular Scaffold CLI globally on your system, run:

bashCopy code

`npm install -g ngx-struct`

### Usage

Navigate to your Angular project's root directory and run:

bashCopy code

`ngx-struct`

Follow the interactive prompts to specify your feature's name and whether it's a standalone or nested feature. The CLI will handle the rest, creating the specified structure and files within your project.

---
