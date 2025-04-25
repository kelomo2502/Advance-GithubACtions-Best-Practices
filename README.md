Advance-GithubACtions-Best-Practices This project leverages GitHub Actions for CI/CD automation. Below is an overview of each GitHub Actions workflow.

Build Pipeline The build.yaml workflow is triggered on push or pull request to the main branch. It does the following:

Checkout the Code: Pulls the latest code from the repository.

Set up Node.js: Configures Node.js version 20.8.1.

Install Dependencies: Installs all the necessary dependencies using npm install.

Build the Application: Builds the application using npm run build.

name: Build

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.8.1'

      - name: Install dependencies
        run: npm install

      - name: Build the application
        run: npm run build

Dockerize Pipeline The dockerize.yaml workflow is triggered when the build pipeline completes. It builds the Docker image and pushes it to Docker Hub:

Log in to Docker Hub: Authenticates using Docker credentials stored as GitHub secrets.

Build and Tag the Docker Image: Builds the Docker image using the Dockerfile, tags it with the latest version, and pushes it to Docker Hub.

Log out from Docker Hub: Logs out of Docker Hub to maintain security.

yaml Copy Edit

name: Dockerize

on:
  workflow_run:
    workflows: ["Build"]
    types:
      - completed

jobs:
  dockerize:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        run: |
          docker build -t my-test-node-app .
          docker tag my-test-node-app:latest ${{ secrets.DOCKER_USERNAME }}/my-test-node-app:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/my-test-node-app:latest

      - name: Log out from Docker Hub
        run: docker logout

Test Pipeline The test.yaml workflow runs the unit tests after the build pipeline completes. It does the following:

Set up Node.js: Configures the required Node.js version.

Install Dependencies: Installs dependencies using npm install.

Run Jest Tests: Runs the tests with npm test to ensure that the application works as expected.

name: Run Tests

on:
  workflow_run:
    workflows: ["Build"]
    types:
      - completed

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.8.1'

      - name: Install dependencies
        run: npm install

      - name: Run Jest tests
        run: npm test

Deploy Pipeline The deploy.yaml workflow is triggered after the Dockerize pipeline completes. It deploys the app to an EC2 instance:

Configure SSH: Sets up SSH using the private key stored in GitHub secrets.

Deploy the Dockerized App: Pulls the latest image from Docker Hub and runs the app on EC2.

Clean up: Stops and removes any dangling Docker containers.

yaml Copy Edit

name: Deploy

on:
  workflow_run:
    workflows: ["Dockerize"]
    types:
      - completed

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure SSH for EC2
        run: |
          echo "${{ secrets.EC2_KEY }}" > ec2_key.pem
          chmod 600 ec2_key.pem

      - name: Deploy to EC2
        run: |
          ssh -o StrictHostKeyChecking=no -i ec2_key.pem ${{ secrets.EC2_USER }}@${{ secrets.EC2_PUBLIC_IP }} << 'EOF'
          docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
          docker pull ${{ secrets.DOCKER_USERNAME }}/my-test-node-app:latest
          docker stop my-test-node-app || true
          docker rm my-test-node-app || true
          docker rmi $(docker images -f "dangling=true" -q) || true
          docker run -d --name my-test-node-app -p 3000:3000 ${{ secrets.DOCKER_USERNAME }}/my-test-node-app:latest
          docker system prune -af || true
          EOF

      - name: Cleanup local SSH key
        run: rm ec2_key.pem

Release Pipeline The release.yaml workflow is triggered when a tag is pushed to the repository. It creates a GitHub release based on the tag:

Checkout the Code: Retrieves the code associated with the tag.

Create a GitHub Release: Uses the actions/create-release action to generate a new release.

yaml Copy Edit

name: Create release

on:
  push:
    tags:
      - '*'  # Trigger the workflow for all tag pushes

jobs:
  build:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
    
      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.VERSION_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: |
            This is an automated release based on tag ${{ github.ref }}
          draft: false
          prerelease: false

App Description This Node.js app is a simple Express server with two routes:

GET /: Returns a welcome message.

GET /status: Returns a status JSON object.

Server Code (server.js)

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to the Node.js Server!');
});

app.get('/status', (req, res) => {
  res.json({ status: 'OK' });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

module.exports = app;

FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

Testing Unit tests are written using Jest and Supertest to test the server's routes.

const request = require('supertest');
const app = require('../server');
let server;

beforeAll(() => {
  server = app.listen(3000);
});

afterAll((done) => {
  server.close(done);
});

describe('Node.js Server', () => {
  it('should return a welcome message from the root route', async () => {
    const response = await request(app).get('/');
    expect(response.text).toBe('Welcome to the Node.js Server!');
  });

  it('should return a status JSON object from the /status route', async () => {
    const response = await request(app).get('/status');
    expect(response.body.status).toBe('OK');
  });
});

Deployment The app is deployed to an EC2 instance using Docker. After the Docker image is built and pushed to Docker Hub, it is pulled on the EC2 instance and run in a Docker container.

To manually deploy the app on your EC2 instance:

docker run -d -p 3000:3000 <your-dockerhub-username>/my-test-node-app:latest

License This project is licensed under the MIT License.
