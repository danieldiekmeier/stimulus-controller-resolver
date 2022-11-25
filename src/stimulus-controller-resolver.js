import { AttributeObserver } from '@hotwired/stimulus'

export default class StimulusControllerResolver {
  constructor(application, resolverFn) {
    this.application = application
    this.loadingControllers = {}
    this.resolverFn = resolverFn

    this.loadStimulusControllers = this.loadStimulusControllers.bind(this)

    this.observer = new AttributeObserver(
      application.element,
      application.schema.controllerAttribute,
      {
        elementMatchedAttribute: this.loadStimulusControllers,
        elementAttributeValueChanged: this.loadStimulusControllers,
      }
    )
  }

  start() {
    this.observer.start()
  }

  stop() {
    this.observer.stop()
  }

  static install(application, resolverFn) {
    const instance = new StimulusControllerResolver(application, resolverFn)
    instance.start()
    return instance
  }

  loadStimulusControllers(element) {
    const controllerNames = element.getAttribute(this.application.schema.controllerAttribute).split(/\s+/)

    controllerNames.forEach((controllerName) =>
      this.loadController(controllerName)
    )
  }

  async loadController(controllerName) {
    if (
      !this.loadingControllers[controllerName] &&
      !this.application.router.modulesByIdentifier.has(controllerName)
    ) {
      this.loadingControllers[controllerName] = true

      const controllerDefinition = await this.resolverFn(controllerName)

      if (controllerDefinition) {
        this.application.register(controllerName, controllerDefinition)
      }

      delete this.loadingControllers[controllerName]
    }
  }
}

export function createViteGlobResolver(...globResults) {
  const controllerLoaders = mapGlobKeysToIdentifiers(globResults)

  const resolverFn = async (controllerName) => {
    const loader = controllerLoaders[controllerName]

    if (process.env.NODE_ENV === 'development') {
      if (!loader) {
        console.warn(
          `Stimulus Controller Resolver can't resolve "${controllerName}". Available:`,
          Object.keys(controllerLoaders)
        )
        return
      }
    }

    return (await loader()).default
  }

  return resolverFn
}

// Vite's glob keys include the complete path of each file, but we need the
// Stimulus identifiers. This function merges an array of glob results into one
// object, where the key is the Stimulus identifier.
// Example:
//   mapGlobKeysToIdentifiers(
//     { './a_controller.js': fn1 },
//     { './b_controller.js': fn2 }
//   )
//   => { a: fn1, b: fn2 }
export function mapGlobKeysToIdentifiers(globResults) {
  return Object.entries(Object.assign({}, ...globResults)).reduce(
    (acc, [key, controllerFn]) => {
      acc[identifierForGlobKey(key)] = controllerFn
      return acc
    },
    {}
  )
}

export const CONTROLLER_FILENAME_REGEX =
  /^(?:.*?(?:controllers|components)\/|\.?\.\/)?(.+)(?:[_-]controller\..+?)$/

// Yoinked from: https://github.com/ElMassimo/stimulus-vite-helpers/blob/e349b0d14d5585773153a178c8fe129821bbf786/src/index.ts#L21-L25
export function identifierForGlobKey(key) {
  const logicalName = (key.match(CONTROLLER_FILENAME_REGEX) || [])[1]
  if (logicalName) return logicalName.replace(/_/g, '-').replace(/\//g, '--')
}
