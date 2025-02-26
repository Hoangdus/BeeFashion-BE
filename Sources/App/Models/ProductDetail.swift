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
    
    @Timestamp(key: "create_at", on: .create)
    var createAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updateAt: Date?
    
	init() {
		
	}
	
	init(id: UUID? = nil, price: Int, quantities: [Int], description: String, images: [String]? = nil, productId: Product.IDValue, brandId: Brand.IDValue, createAt: Date? = nil, updateAt: Date? = nil) {
		self.id = id
		self.price = price
		self.description = description
		self.quantities = quantities
		self.images = images
		self.$product.id = productId
		self.$brand.id = brandId
		self.createAt = createAt
		self.updateAt = updateAt
	}
	
    func toDTO() -> ProductDetailDTO{
		return ProductDetailDTO(price: self.price, quantities: self.quantities, description: self.description, sizes: self.$sizes.value, productId: self.$product.id, brandId: self.$brand.id, images: self.images)
    }
    
}
