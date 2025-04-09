//
//  Role.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 25/02/2025.
//


import Vapor
import Fluent
import struct Foundation.UUID

final class Role: Model, @unchecked Sendable {
    static let schema = "roles"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "role_name")
    var roleName: String
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?
    
    @Timestamp(key: "deleted_at", on: .update)
    var deletedAt: Date?
    
    init() {}
    
    init(id: UUID? = nil, roleName: String, createdAt: Date? = nil, updatedAt: Date? = nil, deletedAt: Date? = nil) {
        self.id = id
        self.roleName = roleName
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.deletedAt = deletedAt
    }
    
    func toDTO() -> RoleDTO{
        .init(id: self.id, roleName: self.roleName, deletedAt: self.deletedAt)
    }
}
