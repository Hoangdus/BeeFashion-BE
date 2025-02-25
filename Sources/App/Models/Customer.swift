//
//  Customer.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 17/02/2025.
//

import Vapor
import Fluent
import struct Foundation.UUID

final class Customer: Model, @unchecked Sendable {
    static let schema = "customers"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "full_name")
    var fullName: String
    
    @Field(key: "phone")
    var phone: String?
    
    @Field(key: "email")
    var email: String
    
    @Field(key: "date_of_birth")
    var dateOfBirth: String?
    
    @Field(key: "gender")
    var gender: String?
    
    @Field(key: "password")
    var password: String
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
    
    init() {}
    
    init(id: UUID? = nil, fullName: String, phone: String? = nil, email: String, dateOfBirth: String? = nil, gender: String? = nil, password: String, createdAt: Date? = nil, updatedAt: Date? = nil) {
        self.id = id
        self.fullName = fullName
        self.phone = phone
        self.email = email
        self.dateOfBirth = dateOfBirth
        self.gender = gender
        self.password = password
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    func toDTO() -> CustomerDTO {
        .init(
            id: self.id, fullName: self.fullName, phone: self.phone, email: self.email, dateOfBirth: self.dateOfBirth, gender: self.gender
        )
    }
    
    
}
