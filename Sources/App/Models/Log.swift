//
//  Log.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 29/04/2025.
//

import Vapor
import Fluent
import struct Foundation.UUID

final class Log: Model, @unchecked Sendable {
    static let schema = "logs"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "name")
    var name: String
    
    @Field(key: "content")
    var content: String
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .create)
    var updatedAt: Date?
    
    init() {
        
    }
    
    init(id: UUID? = nil, name: String, content: String, createdAt: Date? = nil, updatedAt: Date? = nil) {
        self.id = id
        self.name = name
        self.content = content
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    func toDTO() -> LogDTO {
        .init(
            id: self.id,
            name: self.name,
            content: self.content,
            createdAt: self.createdAt
        )
    }
}
