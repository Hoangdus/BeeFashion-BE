//
//  CustomerDTO.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 18/02/2025.
//

import Fluent
import Vapor

struct CustomerDTO: Content {
    var id: UUID?
    var fullName: String?
    var phone: String?
    var email: String?
    var dateOfBirth: String?
    var gender: String?
    
    func toModel() -> Customer {
        let model = Customer()
        
        model.id = self.id
        model.fullName = self.fullName ?? ""
        model.phone = self.phone
        model.email = self.email ?? ""
        model.dateOfBirth = self.dateOfBirth
        model.gender = self.gender
        
        return model
    }
}

struct RegisterDTO: Content {
    var fullName: String
    var email: String
    var password: String
}

struct LoginDTO: Content {
    var email: String
    var password: String
}

