//
//  ProductController.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor

struct ProductController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let products = routes.grouped("products")
		let manageRoute = routes.grouped("admin", "products")
		
		products.group(":customerId"){
			$0.get(use: self.index)
		}
        products.get(use: self.index)
        
//		products.group("images"){ product in
//			product.post(use: uploadImages)
//		}

		manageRoute.get(use: self.getAll)
		manageRoute.post(use: self.create)
        manageRoute.group(":productID") { product in
			product.patch(use: self.restore)
            product.delete(use: self.delete)
        }
    }

//    @Sendable
//	func uploadImages(req: Request) async throws -> HTTPStatus {
//		struct Input: Content {
//			var files: [File]
//		}
//		
//		let input = try req.content.decode(Input.self)
//			
//		let formatter = DateFormatter()
//		formatter.dateFormat = "dd-MM-yyyy HH:mm:ss"
//		let prefix = formatter.string(from: .init())
//		
//		for (_, value) in input.files.enumerated() {
//			let imageFileName = "image \(prefix) \(value.filename)"
//			try await req.fileio.writeFile(value.data, at: "Public/images/\(imageFileName)")
//		}
//		
//		return .ok
//	}
    
    @Sendable
    func index(req: Request) async throws -> [ProductDTO] {
		let customer = try await Customer.find(req.parameters.get("customerId"), on: req.db)
		let products = try await Product.query(on: req.db).with(\.$productDetail).all()
		var productDTOs: [ProductDTO] = []
		
		// add child properties to parent
		for product in products{
			let productDetail = product.productDetail
			if (productDetail != nil){
				var productDTO = product.toDTO()
				productDTO.quantities = productDetail?.quantities
				productDTO.price = productDetail?.price
				if(customer != nil){
					productDTO.isFavByCurrentUser = try await product.$customers.isAttached(to: customer!, on: req.db)
				}
				productDTOs.append(productDTO)
			}
		}
		
		return productDTOs
    }
	
	@Sendable
	func getAll(req: Request) async throws -> [ProductDTO] {
		let products = try await Product.query(on: req.db).withDeleted().with(\.$productDetail).all()
		var productDTOs: [ProductDTO] = []
		
		// add child properties to parent
		for product in products{
			let productDetail = product.productDetail
			var productDTO = product.toDTO()
			productDTO.quantities = productDetail?.quantities
			productDTO.price = productDetail?.price
			productDTOs.append(productDTO)
		}
		
		return productDTOs
	}


    @Sendable
    func create(req: Request) async throws -> ProductDTO {
        let product = try req.content.decode(ProductDTO.self).toModel()

		struct Input: Content {
			var image: File
		}
		
		let input = try req.content.decode(Input.self)
		
		let isImage = ["png", "jpeg", "jpg", "gif"].contains(input.image.extension?.lowercased())
		if (!isImage){
			throw Abort(.badRequest)
		}
		
		let formatter = DateFormatter()
		formatter.dateFormat = "dd-MM-yyyy-HH:mm:ss"
		let prefix = formatter.string(from: .init())
		
		let imageFileName = "image-\(prefix)-\(input.image.filename)"
		try await req.fileio.writeFile(input.image.data, at: "Public/images/\(imageFileName)")
	
		product.image = "\(Environment.get("IMAGE_URL") ?? "http://127.0.0.1:8080/images/")\(imageFileName)"
		
        try await product.save(on: req.db)
        return product.toDTO()
    }

	@Sendable
	func restore(req: Request) async throws -> HTTPStatus {
		guard let productID: UUID = req.parameters.get("productID") else { throw Abort(.badRequest) }
		guard let product = try await Product.query(on: req.db).withDeleted().filter(\.$id == productID).first() else { throw Abort(.notFound) }
		
		try await product.restore(on: req.db)
		return .noContent
	}
	
    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let product = try await Product.find(req.parameters.get("productID"), on: req.db) else {
            throw Abort(.notFound)
        }

        try await product.delete(on: req.db)
        return .noContent
    }
}
