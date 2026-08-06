import ExpoModulesCore
import Foundation

public class BetappShieldModule: Module {
  public func definition() -> ModuleDefinition {
    Name("BetappShield")

    Function("isSupported") { () -> Bool in
      true
    }

    AsyncFunction("prepare") { (promise: Promise) in
      BetappShieldController.shared.prepare { granted, error in
        if let error {
          promise.reject("E_SHIELD_PREPARE", error.localizedDescription)
          return
        }
        promise.resolve(["granted": granted])
      }
    }

    AsyncFunction("start") { (domains: [String], promise: Promise) in
      BetappShieldController.shared.start(domains: domains) { active, error in
        if let error {
          promise.reject("E_SHIELD_START", error.localizedDescription)
          return
        }
        promise.resolve(["active": active])
      }
    }

    AsyncFunction("stop") { (promise: Promise) in
      BetappShieldController.shared.stop { _, error in
        if let error {
          promise.reject("E_SHIELD_STOP", error.localizedDescription)
          return
        }
        promise.resolve(["active": false])
      }
    }

    AsyncFunction("getStatus") { (promise: Promise) in
      BetappShieldController.shared.status { active in
        promise.resolve(["active": active])
      }
    }
  }
}
