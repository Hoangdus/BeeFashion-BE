//
//  ProductDetailSize.swift
//
//
//  Created by HoangDus on 26/02/2025.
//

import Fluent
import Vapor
import struct Foundation.UUID

final class ProductDetailSize: Model, @unchecked Sendable {
	static let schema = "product_detail+size"
	
	@ID(key: .id)
	var id: UUID?
	
	@Parent(key: "product_detail_id")
	var productDetail: ProductDetail
	
	@Parent(key: "size_id")
	var size: Size
	
	@Timestamp(key: "created_at", on: .create)
	var createdAt: Date?
	
	@Timestamp(key: "updated_at", on: .update)
	var updatedAt: Date?
	
	init() {
		
	}
	
	init(id: UUID? = nil, productDetail: ProductDetail, size: Size, createdAt: Date? = nil, updatedAt: Date? = nil) throws {
		self.id = id
		self.$productDetail.id = try productDetail.requireID()
		self.$size.id = try size.requireID()
		self.createdAt = createdAt
		self.updatedAt = updatedAt
	}
}
