//
//  InvoiceItemDTO.swift
//
//
//  Created by HoangDus on 12/03/2025.
//

import Fluent
import Vapor

struct InvoiceItemDTO: Content {
	var id: UUID?
	var productID: UUID
	var sizeID: UUID
	var productDTO: ProductDTO?
	var invoiceID: UUID?
	var quantity: Int
	
	func toModel() -> InvoiceItem {
		return InvoiceItem(productID: self.productID, sizeID: self.sizeID, quantity: self.quantity)
	}
}

