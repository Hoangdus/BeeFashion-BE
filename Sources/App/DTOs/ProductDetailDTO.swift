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
    var quantity: Int
    var productId: Product.IDValue
    var sizeId: Size.IDValue
    var brandId: Brand.IDValue
    var images: String = ""
    var color: String = ""
    var managerId: String = ""
    
    func toModel() -> ProductDetail{
        let model = ProductDetail(price: self.price, quantity: self.quantity, productId: self.productId, sizeId: self.sizeId, brandId: self.brandId)
        return model
    }
}
