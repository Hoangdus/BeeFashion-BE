//
//  ManagerDTO.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 25/02/2025.
//

import Fluent
import Vapor

struct ManagerDTO: Content {
    var id: UUID?
    var role_id: UUID
    var email: String?
    var name: String?
    var phone: String?
    
    func toModel() -> Manager {
        let model = Manager()
        
        model.id = self.id
        model.roleID = self.role_id
        model.email = self.email ?? ""
        model.phone = self.phone ?? ""
        model.name = self.name ?? ""
        
        return model
    }
}

struct ManagerRegisterDTO: Content {
    var name: String
    var role: UUID
    var phone: String
    var email: String
    var password: String
}

struct ManagerLoginDTO: Content {
    var email: String
    var password: String
}
