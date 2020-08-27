import { AttributeObserver } from '@stimulus/mutation-observers'

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
    const controllerNames = element.getAttribute('data-controller').split(/\s+/)

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

      this.application.register(controllerName, controllerDefinition)
      delete this.loadingControllers[controllerName]
    }
  }
}
