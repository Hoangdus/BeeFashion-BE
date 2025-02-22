//
//  Category.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Category: Model, @unchecked Sendable{
    static let schema: String = "categories"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "name")
    var name: String
    
    @Timestamp(key: "create_at", on: .create)
    var createAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updateAt: Date?
    
    init() {
        
    }
    
    init(id: UUID? = nil, name: String, createAt: Date? = nil, updateAt: Date? = nil) {
        self.id = id
        self.name = name
        self.createAt = createAt
        self.updateAt = updateAt
    }
    
    func toDTO() -> CategoryDTO{
        return CategoryDTO(name: self.name)
    }
}
