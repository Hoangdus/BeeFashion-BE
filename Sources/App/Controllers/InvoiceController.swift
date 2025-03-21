//
//  InvoiceController.swift
//
//
//  Created by HoangDus on 11/03/2025.
//

import Fluent
import Vapor

struct InvoiceController: RouteCollection {
	func boot(routes: RoutesBuilder) throws {
		let invoices = routes.grouped("invoices")

		invoices.get(":customerID", use: self.index)
		invoices.post(use: self.create)
		
		invoices.group(":customerID",":invoiceID") { invoice in
			invoice.delete(use: self.delete)
		}
	}

	@Sendable
	func index(req: Request) async throws -> [InvoiceDTO] {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.notFound) }
		let invoices = try await Invoice.query(on: req.db).with(\.$invoiceItems).filter(\.$customer.$id == customerID).all()
		var invoiceDTOs: [InvoiceDTO] = []
		
		for invoice in invoices{
			let invoiceItems = invoice.invoiceItems
			var invoiceItemDTOs: [InvoiceItemDTO] = []
			
			for invoiceItem in invoiceItems { 
				var invoiceItemDTO = invoiceItem.toDTO()
				let sizeDTO = try await Size.query(on: req.db).filter(\.$id == invoiceItem.$size.id).first()?.toDTO()
				let product = try await Product.query(on: req.db).filter(\.$id == invoiceItem.$product.id).with(\.$productDetail).first()
				if (product != nil){
					let productDetail = product!.productDetail
					if (productDetail != nil){
						var productDTO = product!.toDTO()
						productDTO.quantities = productDetail?.quantities
						productDTO.price = productDetail?.price
						invoiceItemDTO.product = productDTO
						invoiceItemDTO.size = sizeDTO
						invoiceItemDTOs.append(invoiceItemDTO)
					}
				}
			}
			
			var invoiceDTO = invoice.toDTO()
			invoiceDTO.invoiceItems = nil
			invoiceDTO.invoiceItemDTOs = invoiceItemDTOs
			invoiceDTOs.append(invoiceDTO)
		}
		
		return invoiceDTOs
	}

	@Sendable
	func create(req: Request) async throws -> HTTPStatus {
		let invoiceDTO = try req.content.decode(InvoiceDTO.self)
		let invoiceItemDTOs = invoiceDTO.invoiceItemDTOs
		
		if (invoiceItemDTOs == nil || invoiceItemDTOs!.count == 0) { throw Abort(.badRequest) }
		
		var invoiceItems: [InvoiceItem] = []
		for invoiceItemDTO in invoiceItemDTOs!{
			invoiceItems.append(invoiceItemDTO.toModel())
		}
		
		let invoice = invoiceDTO.toModel()
		try await invoice.create(on: req.db)
		try await invoice.$invoiceItems.create(invoiceItems, on: req.db)
		
		return .ok
	}

	@Sendable
	func delete(req: Request) async throws -> HTTPStatus {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.notFound) }
		guard let invoiceID: UUID = req.parameters.get("invoiceID") else { throw Abort(.notFound) }
		
		guard let invoice = try await Invoice.query(on: req.db).filter(\.$id == invoiceID).filter(\.$customer.$id == customerID).first() else {
			throw Abort(.notFound)
		}
		
		if(invoice.status == InvoiceStatus.pending){
			invoice.status = InvoiceStatus.cancelled
		}else if(invoice.status == InvoiceStatus.packing){
			invoice.status = InvoiceStatus.pendingcancel
		}
		
		try await invoice.save(on: req.db)
		
		return .ok
	}
}

