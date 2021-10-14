# Stimulus Controller Resolver

If you have a lot of Stimulus Controllers that import other modules, the size can really start to add up. (I have some Controllers that mount [Svelte](https://svelte.dev) components!) Wouldn't it be great if you could load some of your Controllers _lazily_?

To solve this, I built this package that allows you to supply a custom (async!) resolver function for your controllers. It is supposed to provide an alternative to putting all your controllers into your main bundle.


## Installation

```sh
npm i stimulus-controller-resolver
```


## Usage

To load all your Controllers lazily:

```js
import { Application } from '@hotwired/stimulus'
import StimulusControllerResolver from 'stimulus-controller-resolver'

const application = Application.start()

StimulusControllerResolver.install(application, async controllerName => (
  (await import(`./controllers/${controllerName}-controller.js`)).default
))
```

Depending on your configuration, your bundler should then split out all the files in the `controllers`-folder into seperate chunks.

If you want to preload _some_ controllers but still load all the other ones lazily, you can use the good old [`application.register`](https://stimulusjs.org/handbook/installing#using-other-build-systems):

```js
import ImportantController from './controllers/important-controller.js'
import CrucialController from './controllers/crucial-controller.js'

application.register('important-controller', ImportantController)
application.register('crucial-controller', CrucialController)

StimulusControllerResolver.install(application, async controllerName => (
  (await import(`./controllers/${controllerName}-controller.js`)).default
))
```


## API

```js
StimulusControllerResolver.install(application, resolverFn)
```

- `application`: This is your instance of `Stimulus.Application`.
- `resolverFn(controllerName): Controller`: A function that receives the name of the controller (that's the part you write in `data-controller="this-is-the-name"`) and returns the `Controller` class you want to use for this `controllerName`. This will only be called the first time each `controllerName` is encountered.

`install()` returns an instance of `StimulusControllerResolver`, on which you can call:

```js
instance.stop() // to stop getting new controller definitions

// and

instance.start() // to start again
````

`install()` will automatically call `start()`, so most of the time you shouldn't have to do anything.
