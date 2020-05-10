# Vibranium

Vibranium is a CLI based API testing and data generation tool built on Node JS. 

All the tests in Vibranium are written using JSON, making it readable by any person, irrespective of the programming languages they usually use.


## Top Features

Some of the biggest features of Vibranium are:

- **JSON based tests** JSON is a very simple and maintainable way to represent any data and so writing tests in JSON makes Vibranium very simple and fasts to get started with. This also means that Vibranium tests are easily maintainable.

- **Reusability** One of the biggest issue with API tests and data generation logic is that you have a lot of dependent objects that are reused in multiple places. Once these objects are defined in Vibranium, all you need to do is mention this as the dependency for the other object and the objects become highly reusable.

- **Assertions** Writing assertions in Vibranium is plain simple and supports JS in JSON syntax. We can also fail the tests if the time taken to executa an API exceeds a given value.

- **Schema Validations** Validate API responses by bust specifying the expected schema. Vibranium will run the API, validate it against the schema and report all errors, and so writing tests are pretty easy

- **Simple Data Parsing** Want to parse a JSON response and get seome value? You can use simple Javascript dot notation to parse the JSON. You can easily specify to pick a random value in JSON array or to do a map of an array  inside the JSON tests.

- **Data generation tools** Filling dummy data in APIs is pretty easy with Vibranium. You can easily generate Lorem Ipsum strings of given length, random string just by specifying the regex matching it, use inbuilt data sets like names of Harry Potter, Game of Thrones, Star Wars, Marvel, Pokemon and other characters.

- **Reports** HTML, Excel, Junit and JSON report formats are supported. Vibranium measures the time taken per call for each API endpoint and helps compare the reports of the previous executions. 

- **Deployment Support** Vibranium tests can be deployed as a Node JS app along with the apps that you are testing and then invoke tests remotely, thus avoiding network delay in executing tests.

- **Declarative tests** The tests are written in JSON, by mentioning just the required properties of the test and then the expected values. No need to worry about how things work.

- **Fast** Vibranium uses Node and so is single threaded, but the event driven nature of Node makes it really fast for handling code with a lot of I/O, hence making Vibranium pretty fast



---

## Pages:

- [Introduction](0.1.intro.md)
- Getting Started
  - [Workspace](pages/setup/1.1.workspace.md)
  - [Collections, Scenarios and Endpints](pages/setup/1.2.collections_scenarios_endpoints.md)
  - [Instalation](pages/setup/1.3.installation.md)
  - [Configuration](pages/setup/1.4.configuration.md)
  - [Writing Tests](pages/setup/1.6.write_tests.md)
- CLI
  - [CLI intro](pages/cli/2.1.vc.md)
  - [Listing Tests](pages/cli/2.2.vc_l.md)
  - [Creating Tests](pages/cli/2.3.vc_c.md)
  - [Running Tests](pages/cli/2.4.vc_r.md)
  - [Other commands](pages/cli/2.5.vc_others.md)
- Docs
  -  [Config File](pages/setup/1.5.config_json.md)
  -  [Scenario File](pages/docs/3.1.scenario_file.md) 
  -  [A Simple Scenario](pages/docs/3.2.simple_scenario.md) 
  -  [Variables](pages/docs/3.3.variables.md) 
  -  [Dependencies](pages/docs/3.4.dependencies.md) 
  -  [Scripts](pages/docs/3.5.scripts.md) 
  -  [Generators](pages/docs/3.6.generators.md) 
  -  [Reports](pages/docs/3.7.reports.md) 
  -  [Multi System Execution](pages/docs/3.8.systems.md) 
  -  [Parallel Execution](pages/docs/3.9.parallel.md) 
  -  [Repeat tests](pages/docs/3.10.repeat.md) 
  -  [Examples](pages/docs/3.11.examples.md) 
- [Credits](0.2.credits.md)