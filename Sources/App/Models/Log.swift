//
//  Log.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 29/04/2025.
//

import Vapor
import Fluent
import struct Foundation.UUID

enum ContentType: String, Codable {
    case add, changeStatus, approval, other
}

final class Log: Model, @unchecked Sendable {
    static let schema = "logs"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "name")
    var name: String
    
    @Field(key: "content_type")
    var contentType: ContentType
    
    @Field(key: "content")
    var content: String
    
    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?
    
    @Timestamp(key: "updated_at", on: .create)
    var updatedAt: Date?
    
    init() {
        
    }
    
    init(id: UUID? = nil, name: String, contentType: ContentType, content: String, createdAt: Date? = nil, updatedAt: Date? = nil) {
        self.id = id
        self.name = name
        self.contentType = contentType
        self.content = content
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    func toDTO() -> LogDTO {
        .init(
            id: self.id,
            name: self.name,
            contentType: self.contentType,
            content: self.content,
            createdAt: self.createdAt
        )
    }
}
