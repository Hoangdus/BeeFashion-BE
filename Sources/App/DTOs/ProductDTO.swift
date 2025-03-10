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
    var name: String
    var image: String?
	var price: Int?
	var isFavByCurrentUser = false
	var productDetail: ProductDetail?
	var quantities: [Int]?
    var categoryId: Category.IDValue
	var deletedAt: Date?
    
    func toModel() -> Product {
        let model = Product(name: self.name, image: "", categoryId: self.categoryId)
        
        return model
    }
}
