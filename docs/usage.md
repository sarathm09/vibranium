

# Usage

> Please note that there might be new commands added to Vibranium, which I haven't updated here. In such cases, please feel free to suggest the changes using GitHub.

Vibranium is a CLI tool and you'll need to run commands in your Command Prompt/Terminal to access it's features. Most of Vibranium's functionality can be accessed with the cli `vib-cli` or `vc` in short and almost all of them have been mentioned in the commandline help. To access it, type `vc --help`

```shell
❯ vc --help   
Usage: vc [options] [command]

Options:
  -V, --version       output the version number
  -h, --help          output usage information

Commands:
  run|r [options]     Run the vibranium tests
  list|l [options]    List all the vibranium tests
  debug|d [options]   Enter debug mode
  setup|s [options]   Setup Vibranium with the current directory ('') as the 
                      workspace
  create|c [options]  Create a new scenario test file
```

---



## Commands

* **run** or **r** : To run the vibranium test cases available inside the workspace. Refer to [Running Tests](runningtests.md) for more details. Details are also available by running the command `vc r --help`
* **list** or **l** : To list all the collections, scenarios and tests available. Refer to [Listing Tests](listingtests.md) for more details. Details are also available by running the command `vc l --help`
* **setup** or **s** : To setup vibranium. `vc s --help`. Refer to [Installation and Setup](installation.md) for more details.
* **create** or **c** : To create new scenarios.`vc c --help`. Refer to [Creating Tests](creatingtests.md) for more details.
* **debug** or **d** : To debug the vibranium installation and other issues. You would not need this command in most cases.