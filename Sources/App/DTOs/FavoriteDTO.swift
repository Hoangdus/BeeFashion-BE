//
//  FavoriteDTO.swift
//
//
//  Created by HoangDus on 28/02/2025.
//

import Fluent
import Vapor

struct FavoriteDTO: Content {
	var id: UUID?
	var productId: Product.IDValue
	var customerId: Customer.IDValue
	
	func toModel() -> Favorite {
		let model = Favorite(id: self.id, customerId: self.customerId, productId: self.productId)
		return model
	}
}

