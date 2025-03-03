//
//  CartController.swift
//
//
//  Created by HoangDus on 01/03/2025.
//

import Fluent
import Vapor

struct CartController: RouteCollection {
	func boot(routes: RoutesBuilder) throws {
		let carts = routes.grouped("carts")
		
		carts.group(":customerId"){
			$0.get(use: self.index)
		}
		
		carts.group(":customerId", ":productId"){
			$0.post(use: self.create)
			$0.delete(use: self.delete)
			$0.put(use: self.update)
		}
	}

	@Sendable
	func index(req: Request) async throws -> [ProductDTO] {
		guard let customerId: UUID = req.parameters.get("customerId") else { throw Abort(.badRequest) }
		
		guard let customer = try await Customer.query(on: req.db).with(\.$cartProducts).filter(\.$id == customerId).first() else {
			throw Abort(.notFound)
		}
		let cartProducts = customer.cartProducts
		var productDTOs: [ProductDTO] = []
		
		for cartProduct in cartProducts{
			let productDetail = try await ProductDetail.query(on: req.db).filter(\.$product.$id == cartProduct.id!).first()
			if (productDetail != nil){
				var productDTO = cartProduct.toDTO()
				productDTO.quantities = productDetail!.quantities
				productDTO.price = productDetail!.price
				productDTO.isFavByCurrentUser = try await cartProduct.$customers.isAttached(to: customer, on: req.db)
				productDTOs.append(productDTO)
			}
		}
		
		return productDTOs
	}

	@Sendable
	func create(req: Request) async throws -> HTTPStatus {
		guard let customerId: UUID = req.parameters.get("customerId") else { throw Abort(.badRequest) }
		guard let productId: UUID = req.parameters.get("productId") else { throw Abort(.badRequest) }
		
		let cartDTO = try req.content.decode(CartDTO.self)
		
		guard let product = try await Product.find(productId, on: req.db) else { throw Abort(.notFound) }
		guard let customer = try await Customer.find(customerId, on: req.db) else { throw Abort(.notFound) }
		
		if(try await customer.$cartProducts.isAttached(to: product, on: req.db)){
			let cartItem = try await Cart.query(on: req.db).filter(\.$product.$id == productId).filter(\.$customer.$id == customerId).first()
			cartItem!.quantity += cartDTO.quantity
			try await cartItem?.save(on: req.db)
			return .ok
		}
		
		try await customer.$cartProducts.attach(product, on: req.db){
			$0.quantity = cartDTO.quantity
		}
		return .ok
	}	
	
	@Sendable 
	func update(req: Request) async throws -> CartDTO {
		guard let customerId: UUID = req.parameters.get("customerId") else { throw Abort(.badRequest) }
		guard let productId: UUID = req.parameters.get("productId") else { throw Abort(.badRequest) }
		
		let cartDTO = try req.content.decode(CartDTO.self)
		
		guard let product = try await Product.find(productId, on: req.db) else { throw Abort(.notFound) }
		guard let customer = try await Customer.find(customerId, on: req.db) else { throw Abort(.notFound) }
		
		if(try await customer.$cartProducts.isAttached(to: product, on: req.db)){
			let cartItem = try await Cart.query(on: req.db).filter(\.$product.$id == productId).filter(\.$customer.$id == customerId).first()
			cartItem!.quantity += cartDTO.quantity
			if(cartItem!.quantity <= 0){
				try await customer.$cartProducts.detach(product, on: req.db)
				throw Abort(.ok, reason: "item removed")
			}
			try await cartItem?.save(on: req.db)
			return cartDTO
		}
		
		throw Abort(.notFound)
	}

	@Sendable
	func delete(req: Request) async throws -> HTTPStatus {
		guard let customerId: UUID = req.parameters.get("customerId") else { throw Abort(.badRequest) }
		guard let productId: UUID = req.parameters.get("productId") else { throw Abort(.badRequest) }
		
		guard let product = try await Product.find(productId, on: req.db) else { throw Abort(.notFound) }
		guard let customer = try await Customer.find(customerId, on: req.db) else { throw Abort(.notFound) }
		
		try await customer.$cartProducts.detach(product, on: req.db)
		return .ok
	}
}
