# IOTA Trinity Desktop Wallet

Testing: [![Build Status](https://badge.buildkite.com/7116f57245f08626a7ef985f3805bfc836f1d1402224012e6a.svg)](https://buildkite.com/iota-foundation/trinity-desktop-primary)

Deployment: [![Build Status](https://badge.buildkite.com/2c9f4392dc33c7d5f164c5e59da78bf11219086a6756362d11.svg)](https://buildkite.com/iota-foundation/trinity-desktop-deployment)

This is the repository for the IOTA Trinity Desktop Wallet. The application is based on [React](https://reactjs.org) and built on [Electron](https://electronjs.org/).

## Building the application

To build the application locally from source, follow these steps:

### 1. Install Node.JS and Electron

First you need to install Node.JS if you haven’t done that already.
Then run the following command to install electron globally.

```
npm install electron -g
```

### 2. Clone or download the Trinity repo from GitHub.

Clone the repo by running this command:

```
git clone https://github.com/iotaledger/trinity-wallet.git
```

Or [download](https://github.com/iotaledger/trinity-wallet/archive/develop.zip) the repo and extract the archive.

After cloning or downloading and extracting the application run:

```
cd trinity-wallet
```

### 3. Install dependencies

Now we need to install dependencies, such as the electron installer or the React code packager. Do this by running:

```
npm run full-setup
```

### 3. Prepare Trinity desktop appplication

When the npm install is done you can prepare the wallet application for compilation by running:

```
npm run build
```


### 4. Compile Trinity desktop appplication

After the application is prepared you can compile the wallet application by running:

```
npm run compile:mac
```

Change `mac` to your operating system - `mac`, `win` or `linux`.

This will start the building process for the Trinity Desktop application and could take a couple of minutes to finish.

After the building is finished, the application executable and installation files will be located in the directory `src/desktop/out/`.

### 4. Run Trinity desktop app in development mode

To start the application in development mode, run

```
npm start
```

## Trinity theming

To create proof checking screenshots of key wallet views for all Trinity themes, run

```
npm style:shots
```

After the command finished, the screenshots will be located in the directory `/shots/`
