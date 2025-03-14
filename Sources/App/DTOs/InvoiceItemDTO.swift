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
//	var invoiceID: UUID?
	var quantity: Int
	
	func toModel() -> InvoiceItem {
		return InvoiceItem(productID: self.productID, quantity: self.quantity)
	}
}

