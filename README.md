![Logo](https://s3-eu-west-1.amazonaws.com/org.paraio/para.png)

# Para Web Console

[![Join the chat at https://gitter.im/Erudika/para](https://badges.gitter.im/Erudika/para.svg)](https://gitter.im/Erudika/para?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## What is this?

**Para** was designed as a simple and modular backend framework for object persistence and retrieval.
It helps you build applications faster by taking care of the backend. It works on three levels -
objects are stored in a NoSQL data store or any old relational database, then automatically indexed
by a search engine and finally, cached.

This is the admin console for managing a **Para** backend.

![screenshot](images/grab.png)

### Quick start

**LIVE DEMO:** [console.paraio.org](http://console.paraio.org)

To run it locally, start up a web server like Express or Python:
```sh
$ cd para-admin-ui
$ python -m SimpleHTTPServer 9000
```

## ng-admin and Restangular

This project is based on [ng-admin](https://github.com/marmelab/ng-admin) and [Restangular](https://github.com/mgonto/restangular)
so be sure to check their docs first:

#### [ng-admin docs](http://ng-admin-book.marmelab.com)

#### [Restangular docs](https://github.com/mgonto/restangular#table-of-contents)

## Para documentation

### [Read the Docs](http://paraio.org/docs)

## Contributing

1. Fork this repository and clone the fork to your machine
2. Create a branch (`git checkout -b my-new-feature`)
3. Implement a new feature or fix a bug and add some tests
4. Commit your changes (`git commit -am 'Added a new feature'`)
5. Push the branch to **your fork** on GitHub (`git push origin my-new-feature`)
6. Create new Pull Request from your fork

For more information see [CONTRIBUTING.md](https://github.com/Erudika/para/blob/master/CONTRIBUTING.md)

## License
[Apache 2.0](LICENSE)
