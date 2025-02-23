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
    var quantity: Int
    
	@OptionalField(key: "images")
	var images: [String]?
	
    @Parent(key: "product_id")
    var product: Product
    
    @Parent(key: "size_id")
    var size: Size
    
    @Parent(key: "brand_id")
    var brand: Brand
    
    @Timestamp(key: "create_at", on: .create)
    var createAt: Date?
    
    @Timestamp(key: "updated_at", on: .update)
    var updateAt: Date?
    
	init() {
		
	}
	
	init(id: UUID? = nil, price: Int, quantity: Int, images: [String], productId: Product.IDValue, sizeId: Size.IDValue, brandId: Brand.IDValue, createAt: Date? = nil, updateAt: Date? = nil) {
		self.id = id
		self.price = price
		self.quantity = quantity
		self.images = images
		self.$product.id = productId
		self.$size.id = sizeId
		self.$brand.id = brandId
		self.createAt = createAt
		self.updateAt = updateAt
	}
	
    func toDTO() -> ProductDetailDTO{
		return ProductDetailDTO(price: self.price, quantity: self.quantity, productId: self.$product.id, sizeId: self.$size.id, brandId: self.$brand.id, images: self.images ?? [])
    }
    
}
