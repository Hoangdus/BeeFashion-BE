//
//  Size.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class Size: Model, @unchecked Sendable {
    static let schema = "sizes"
    
    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

	@Siblings(through: ProductDetailSize.self, from: \.$size, to: \.$productDetail)
	var productDetails: [ProductDetail]
	
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
    
    func toDTO() -> SizeDTO {
        return SizeDTO(id: self.id, name: self.name)
    }
}
