import { AttributeObserver } from "@hotwired/stimulus"

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
      },
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
    const controllerNames = element
      .getAttribute(this.application.schema.controllerAttribute)
      .split(/\s+/)

    controllerNames.forEach((controllerName) =>
      this.loadController(controllerName),
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

export function createViteGlobResolver(...globsOrConfigs) {
  const globResults = globsOrConfigs.map(normalizeGlobConfig)
  const controllerLoaders = mapGlobKeysToIdentifiers(globResults)

  const resolverFn = async (controllerName) => {
    const loader = controllerLoaders[controllerName]

    if (process.env.NODE_ENV === "development") {
      if (!loader) {
        console.warn(
          `Stimulus Controller Resolver can't resolve "${controllerName}". Available:`,
          Object.keys(controllerLoaders),
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
//   mapGlobKeysToIdentifiers([
//     {glob: { "./a_controller.js": fn1 }, toIdentifier, regex},
//     {glob: { "./b_controller.js": fn2 }, toIdentifier, regex}
//   ])
//   => { a: fn1, b: fn2 }
export function mapGlobKeysToIdentifiers(globResults) {
  const acc = []

  globResults.forEach(({ glob, toIdentifier, regex }) => {
    Object.entries(glob).forEach(([key, controllerFn]) => {
      acc[toIdentifier(key, regex)] = controllerFn
    })
  })

  return acc
}

export function normalizeGlobConfig(globOrConfig) {
  const normalized = {
    glob: globOrConfig,
    toIdentifier: identifierForGlobKey,
    regex: CONTROLLER_FILENAME_REGEX,
  }

  if (Object(globOrConfig).hasOwnProperty("glob")) {
    return { ...normalized, ...globOrConfig }
  } else {
    return normalized
  }
}

// export const CONTROLLER_FILENAME_REGEX =
// /^(?:.*?(?:controllers)\/|\.?\.\/)?(.+?)(?:[_-]controller\..+?)$/
export const CONTROLLER_FILENAME_REGEX =
  /^(?:.*?(?:controllers|components)\/|\.?\.\/)?(.+?)(?:[_-]controller\..+?)$/

// Yoinked from: https://github.com/ElMassimo/stimulus-vite-helpers/blob/e349b0d14d5585773153a178c8fe129821bbf786/src/index.ts#L21-L25
export function identifierForGlobKey(key, regex = CONTROLLER_FILENAME_REGEX) {
  const logicalName = (key.match(regex) || [])[1]
  if (logicalName) return logicalName.replace(/_/g, "-").replace(/\//g, "--")
}
