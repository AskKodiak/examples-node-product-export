# Ask Kodiak Node.js SDK Example Project - Command Line Export

## Table of Contents

 * [Overview](#overview)
 * [Basic Usage](#basic-usage) 
 * [Contributing](#contributing)
 * [Supported Enviornments](#supported-environments) 

## Overview 

This project uses the [Ask Kodiak Node.js SDK](https://github.com/AskKodiak/node-sdk) to export eligibility for a specified product from Ask Kodiak as a CSV file. The resultant file is saved to disk. 

It is an example of how to use the Ask Kodiak Node.js SDK in a project.

Start by taking a look at `export-product.js` to see the details of the implementation. It calls the Ask Kodiak API for eligibility for a given product at the NAICS 'national-industry' level, then calls the Ask Kodiak API for a list of all NAICS national industry codes, and then builds a CSV representing the product's eligibility for all codes and writes it to disk. 

`export-product-with-inclusions` builds on that example by including additional columns in the spreadsheet that describe included notes, highlights, guidelines or collateral for a given NAICS group or any group in it's ancestry.

## Basic Usage

Create a CSV with the product's eligibility at the 6-digit ('national-industry') NAICS level.

```bash

node export-product.js --gid="yourGroupId" --key="yourAPIKey" --pid="aProductId"

```

The results can be found in the file `output.csv`.

Create a CSV with the product's eligibility at the 6-digit ('national-industry') NAICS level including any conditional content that applies to each code or any code in it's ancestry.

```bash

node export-product-with-inclusions.js --gid="yourGroupId" --key="yourAPIKey" --pid="aProductId"

```

The results can be found in the file `output-with-inclusions.csv`.

## Contributing

Please refer to the [CONTRIBUTING page](./CONTRIBUTING.md) for more information
about how you can contribute to this project. We welcome bug reports, feature
requests, code review feedback, and also pull requests.

## Supported Environments

The Ask Kodiak Node.js SDK supports Node.js version 6.0 and higher.

