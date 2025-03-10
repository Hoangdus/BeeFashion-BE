//
//  ProductDetail.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class ProductDetail: Model, @unchecked Sendable{
    static let schema = "product_details"
    
    @ID(key: .id)
    var id: UUID?
    
    @Field(key: "price")
    var price: Int
    
    @Field(key: "quantity")
    var quantities: [Int]
    
	@Field(key: "description")
	var description: String
	
	@OptionalField(key: "images")
	var images: [String]?
	
    @Parent(key: "product_id")
    var product: Product
    
	@Siblings(through: ProductDetailSize.self, from: \.$productDetail, to: \.$size)
	public var sizes: [Size]
    
    @Parent(key: "brand_id")
    var brand: Brand
    
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	@Timestamp(key: "deleted_at", on: .delete)
	var deletedAt: Date?
    
	init() {
		
	}
	
	init(id: UUID? = nil, price: Int, quantities: [Int], description: String, images: [String]? = nil, productId: Product.IDValue, brandId: Brand.IDValue, createdAt: Date? = nil, updatedAt: Date? = nil) {
		self.id = id
		self.price = price
		self.description = description
		self.quantities = quantities
		self.images = images
		self.$product.id = productId
		self.$brand.id = brandId
		self.createdAt = createdAt
		self.updatedAt = updatedAt
	}
	
    func toDTO() -> ProductDetailDTO{
		return ProductDetailDTO(price: self.price, quantities: self.quantities, description: self.description, productId: self.$product.id, brandId: self.$brand.id, images: self.images)
    }
    
}
