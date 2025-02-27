//
//  Brand.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Brand: Model, @unchecked Sendable {
    static let schema = "brands"
    
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
    
    func toDTO() -> BrandDTO {
        return BrandDTO(id: self.id, name: self.name)
    }
}
