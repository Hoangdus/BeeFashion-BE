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
	
	init() {
		
	}
	
	init(id: UUID? = nil, productDetail: ProductDetail, size: Size) throws {
		self.id = id
		self.$productDetail.id = try productDetail.requireID()
		self.$size.id = try size.requireID()
	}
}
