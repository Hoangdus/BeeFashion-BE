//
//  ProductDetailDTO.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor

struct ProductDetailDTO: Content{
    var price: Int
    var quantities: [Int]
	var description: String
	var sizeIds: [Size.IDValue]?
	var sizes: [SizeDTO]?
    var productId: Product.IDValue
    var brandId: Brand.IDValue
    var images: [String]?
    var color: String = ""
    var managerId: String = ""
	var deletedAt: Date?
    
    func toModel() -> ProductDetail{
		let model = ProductDetail(price: self.price, quantities: self.quantities, description: self.description, productId: self.productId, brandId: self.brandId)
        return model
    }
}
