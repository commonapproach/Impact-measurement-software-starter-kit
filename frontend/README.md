### Pathfinder Frontend

#### Install dependencies
```shell
npm install -g yarn
yarn install
```

#### Start Frontend
```shell
yarn start
```

#### Build Frontend
```shell
yarn build
```

#### Serve built frontend
```shell
npx serve -s ./build
```

### Allow Self-Signed Localhost certificate
Chrome: Enable chrome://flags/#allow-insecure-localhost and reboot chrome.

Firefox: Go to Preferences --> Privacy & Security --> View Certificates --> Servers --> Add Exception --> Add localhost:5001
