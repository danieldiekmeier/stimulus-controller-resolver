# Stimulus Controller Resolver

If you have a lot of Stimulus Controllers that import other modules, the size can really start to add up. (I have some Controllers that mount [Svelte](https://svelte.dev) components!) Wouldn't it be great if you could lazy load some of your Controllers?

This package allows you to supply a custom (async!) resolver function for your controllers. It is supposed to provide an alternative to putting all your controllers into your main bundle.


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


### With Vite Glob Import

If you're using Vite, you can make use of [Vite's Glob Import](https://vitejs.dev/guide/features.html#glob-import). This package exports an additional function called `createViteGlobResolver` that handles this for you. Pass it one or more globs:

```js
import { Application } from "@hotwired/stimulus"
import StimulusControllerResolver, { createViteGlobResolver } from 'stimulus-controller-resolver'

const application = Application.start()

StimulusControllerResolver.install(application, createViteGlobResolver(
  import.meta.glob('../controllers/*-controller.js'),
  import.meta.glob('../../components/**/*-controller.js')
))
```

The filenames will be transformed according to the [Stimulus Identifier Rules](https://stimulus.hotwired.dev/reference/controllers#identifiers), starting from the `controllers` or `components` folders:

| Path                                           | Stimulus Identifier |
|------------------------------------------------|---------------------|
| ../controllers/stickiness-controller.js        | `stickiness`        |
| ../../components/deep_dir/slider-controller.js | `deep-dir--slider`  |

If `process.env.NODE_ENV === 'development'`, it also prints a helpful message if you request a controller that is not available:

```
Stimulus Controller Resolver can't resolve "missing". Available: ['this-one', 'and-this-one']
```

💡 If you need more flexibility, you can of course always implement your own custom resolver function, as described above.


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
```

`install()` will automatically call `start()`, so most of the time you shouldn't have to do anything.
