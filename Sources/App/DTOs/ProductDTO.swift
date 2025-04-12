//
//  ProductDTO.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor

struct ProductDTO: Content {
    var id: UUID?
    var name: String?
    var image: String?
	var price: Int?
	var isFavByCurrentUser: Bool? = false
	var productDetail: ProductDetail?
	var quantities: [Int]?
    var categoryId: Category.IDValue?
	var managerID: Manager.IDValue?
	var manager: ManagerDTO?
	var deletedAt: Date?
	var createdAt: Date?

	func toModel(normalizedName: String) -> Product {
		let model = Product(name: self.name ?? "", normalizedName: normalizedName, image: "", categoryID: self.categoryId ?? UUID(), managerID: self.managerID ?? UUID())
        return model
    }
}
