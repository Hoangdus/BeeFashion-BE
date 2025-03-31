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
		
		carts.group(":customerID"){
			$0.get(use: self.index)
		}
		
		carts.group(":customerID", ":productID"){
			$0.post(use: self.create)
			$0.delete(":sizeID", use: self.delete)
			$0.put(use: self.update)
		}
	}

	@Sendable
	func index(req: Request) async throws -> [CartDTO] {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
		
		guard let customer = try await Customer.query(on: req.db).with(\.$cartProducts).filter(\.$id == customerID).first() else {
			throw Abort(.notFound)
		}
		
		let carts = try await Cart.query(on: req.db).filter(\.$customer.$id == customerID).all()
		var cartDTOs: [CartDTO] = []
		
		for cart in carts {
			let sizeDTO = try await Size.query(on: req.db).filter(\.$id == cart.$size.id).first()?.toDTO()
			let product = try await Product.query(on: req.db).with(\.$productDetail).filter(\.$id == cart.$product.id).first()
			let productDetail = product?.productDetail
			var cartDTO = cart.toDTO()
			if (product != nil || productDetail != nil){
				var productDTO = product!.toDTO()
				productDTO.quantities = productDetail!.quantities
				productDTO.price = productDetail!.price
				productDTO.isFavByCurrentUser = try await product!.$customers.isAttached(to: customer, on: req.db)
				cartDTO.product = productDTO
				cartDTO.size = sizeDTO
				cartDTOs.append(cartDTO)
			}
		}
		
		return cartDTOs
	}

	@Sendable
	func create(req: Request) async throws -> HTTPStatus {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
		guard let productID: UUID = req.parameters.get("productID") else { throw Abort(.badRequest) }
		
		let cartDTO = try req.content.decode(CartDTO.self)
		
		guard let product = try await Product.find(productID, on: req.db) else { throw Abort(.notFound) }
		guard let customer = try await Customer.find(customerID, on: req.db) else { throw Abort(.notFound) }
		
		if(try await customer.$cartProducts.isAttached(to: product, on: req.db)){
			let cartItem = try await Cart.query(on: req.db).filter(\.$product.$id == productID).filter(\.$customer.$id == customerID).filter(\.$size.$id == cartDTO.sizeID).first()
			if(cartItem != nil){
				cartItem!.quantity += cartDTO.quantity
				try await cartItem?.save(on: req.db)
				return .ok
			}
		}
		
		try await customer.$cartProducts.attach(product, on: req.db){
			$0.$size.id = cartDTO.sizeID
			$0.quantity = cartDTO.quantity
		}
		return .ok
	}	
	
	@Sendable 
	func update(req: Request) async throws -> CartDTO {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
		guard let productID: UUID = req.parameters.get("productID") else { throw Abort(.badRequest) }
		
		let cartDTO = try req.content.decode(CartDTO.self)
		
		guard let product = try await Product.find(productID, on: req.db) else { throw Abort(.notFound) }
		guard let customer = try await Customer.find(customerID, on: req.db) else { throw Abort(.notFound) }
		
		if(try await customer.$cartProducts.isAttached(to: product, on: req.db)){
			let cartItem = try await Cart.query(on: req.db).filter(\.$product.$id == productID).filter(\.$customer.$id == customerID).filter(\.$size.$id == cartDTO.sizeID).first()
			if(cartItem != nil){
				cartItem!.quantity += cartDTO.quantity
				if(cartItem!.quantity <= 0){
					try await customer.$cartProducts.detach(product, on: req.db)
					throw Abort(.ok, reason: "item removed")
				}
				try await cartItem?.save(on: req.db)
				return cartDTO
			}
		}
		
		throw Abort(.notFound)
	}

	@Sendable
	func delete(req: Request) async throws -> HTTPStatus {
		guard let customerID: UUID = req.parameters.get("customerID") else { throw Abort(.badRequest) }
		guard let productID: UUID = req.parameters.get("productID") else { throw Abort(.badRequest) }
		guard let sizeID: UUID = req.parameters.get("sizeID") else { throw Abort(.badRequest) }
		
		guard let cartItem = try await Cart.query(on: req.db).filter(\.$customer.$id == customerID).filter(\.$product.$id == productID).filter(\.$size.$id == sizeID).first() else { throw Abort(.notFound) }
		
		try await cartItem.delete(on: req.db)
		return .ok
	}
}
