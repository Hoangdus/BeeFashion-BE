//
//  ProductDetailController.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor

struct ProductDetailController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let productDetails = routes.grouped("productdetails")

        productDetails.get(use: self.index)
        productDetails.post(use: self.create)
        productDetails.group("getByProductID", ":productId"){ productId in
            productId.get(use: self.getByProductId)
        }
        productDetails.group(":productDetailID") { productDetail in
            productDetail.delete(use: self.delete)
        }
    }
    
    @Sendable
    func getByProductId(req: Request) async throws -> [ProductDetailDTO]{
        guard let uuidString = req.parameters.get("productId") else { throw Abort(.badRequest) }
        let productUUID = UUID(uuidString: uuidString)
        
        let productDetails = try await ProductDetail.query(on: req.db).filter(\.$product.$id == productUUID!).all()
        return productDetails.compactMap(){
            productDetail in productDetail.toDTO()
        }
    }

    @Sendable
    func index(req: Request) async throws -> [ProductDetailDTO] {
		let productDetails = try await ProductDetail.query(on: req.db).with(\.$sizes).all()
		let productDetailDTOs = productDetails.map{$0.toDTO()}
		
		return productDetailDTOs
    }

    @Sendable
    func create(req: Request) async throws -> HTTPStatus {
		let productDetailDTO = try req.content.decode(ProductDetailDTO.self)
		
		var sizes: [Size] = []
		for sizeId in productDetailDTO.sizeIds ?? [] {
			guard let size = try await Size.find(sizeId, on: req.db) else { throw Abort(.badRequest) }
			sizes.append(size)
		}
		
		let productDetail = productDetailDTO.toModel()
		
		struct Input: Content {
			var images: [File]
		}
		
		let input = try req.content.decode(Input.self)
			
		let formatter = DateFormatter()
		formatter.dateFormat = "dd-MM-yyyy-HH:mm:ss"
		let prefix = formatter.string(from: .init())
		
		var imageFileNamesWithUrl: [String] = []
		
		for (_, value) in input.images.enumerated() {
			let isImage = ["png", "jpeg", "jpg", "gif"].contains(value.extension?.lowercased())
			if (!isImage){
				throw Abort(.badRequest)
			}
			
			let imageFileName = "image-\(prefix)-\(value.filename)"
			imageFileNamesWithUrl.append("\(Environment.get("IMAGE_URL") ?? "http://127.0.0.1:8080/images/")\(imageFileName)")
			try await req.fileio.writeFile(value.data, at: "Public/images/\(imageFileName)")
		}
		
		productDetail.images = imageFileNamesWithUrl
        try await productDetail.save(on: req.db)
//        return productDetail.toDTO()
		try await productDetail.$sizes.attach(sizes, on: req.db)
		
		return .ok
    }

    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let productDetail = try await ProductDetail.find(req.parameters.get("productDetailID"), on: req.db) else {
            throw Abort(.notFound)
        }

        try await productDetail.delete(on: req.db)
        return .noContent
    }
}
