//
//  CartDTO.swift
//
//
//  Created by HoangDus on 01/03/2025.
//

import Fluent
import Vapor

struct CartDTO: Content {
	var id: UUID?
	var quantity: Int
	var productId: Product.IDValue?
	var customerId: Customer.IDValue?
	
	func toModel() -> Cart {
		let model = Cart(id: self.id, customerId: self.customerId!, productId: self.productId!, quantity: self.quantity)
		return model
	}
}
