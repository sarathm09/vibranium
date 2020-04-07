# Installation and Setup

Installing Vibranium is as easy as installing any npm module. All you need is [Node.JS](https://nodejs.org/en/) installed in your system.

## Steps

- ### Install [Node.JS](https://nodejs.org/en/)

  Head over to [Node.JS](https://nodejs.org/en/) homepage and download the latest (Preferably LTS) installer file and install it in your system. To make sure it is installed properly, try running `node --version` and `npm --version` in command line/terminal to see if they are working.

- ### Install Vibranium

  Open Command Line/Terminal in your system and run the following command

  ```shell
  npm install -g vibranium
  ```

  To see if the installation is successful, try running `vib-cli --version` 

  Once you run install Vibranium, you'll have a CLI command (`vib-cli`  alias `vc` ) that you can use to execute vibranium tasks. You can use either `vib-cli`  or `vc`, both give refer to the same command.

- ### Setup Vibranium

  This step initialises VIbranium configurations. Open Command Line/ Terminal and change the directory to the directory that you with to make as your workspace and run the following command and enter the answers to the questions that follow

  ```shell
  vc setup
  ```

  Example:

  ```shell
  cd C:\\Users\sarathm09\     
  mkdir vibraniumWorkspace && cd vibraniumWorkspace
  
  vc setup                                                
  Please enter your user id: sarathm09
  Please enter your email id: some.email@domain.com
  Please enter your name: VibraniumTester
  ```

- ### Clone test cases

  If you have test cases already available, you'll have to clone the test cases into the workspace

  ```shell
  cd C:\\Users\sarathm09\vibraniumWorkspace
  git clone https://github.com/someUser/Vibranium-Tests.git
  ```



### Verify the Installation

There are a few important points that we can use to verify if the installation is successful.

1. Make sure Node JS and npn are installed globally
2. Make sure you are able to run the command `vc` from any directory
3. Make sure that you run the `vs setup`command only after you change the directory to the directory you choose as your workspace
4. Make sure that the test cases are clonned inside the workspace and the tests directory name is updated in the config.json file in the workspace.