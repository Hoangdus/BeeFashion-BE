//
//  Manager.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 25/02/2025.
//

import Vapor
import Fluent
import struct Foundation.UUID

final class Manager: Model, @unchecked Sendable {
    static let schema = "managers"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "role_id")
    var roleID: UUID
    
    @Field(key: "name")
    var name: String
    
    @Field(key: "phone")
    var phone: String
    
    @Field(key: "email")
    var email: String
    
    @Field(key: "password")
    var password: String
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
    
    init() {}
    
    init(id: UUID? = nil, roleID: UUID ,name: String, phone: String, email: String, password: String, createdAt: Date? = nil, updatedAt: Date? = nil) {
        self.id = id
        self.roleID = roleID
        self.name = name
        self.phone = phone
        self.email = email
        self.password = password
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    func toDTO() -> ManagerDTO {
        .init(
            id: self.id, role_id: self.roleID, email: self.email, name: self.name, phone: self.phone
        )
    }
    
    
}
