% Material list
materials.Steel = struct('density', 7850, 'E', 210e9, 'nu', 0.30, 'cost', 0.90);
materials.Aluminum = struct('density', 2750, 'E', 75e9, 'nu', 0.32, 'cost', 2.60);
materials.Magnesium = struct('density', 1800, 'E', 45e9, 'nu', 0.35, 'cost', 2.30);
materials.Beryllium = struct('density', 1850, 'E', 300e9, 'nu', 0.02, 'cost', 756.00);
materials.Titanium = struct('density', 4500, 'E', 110e9, 'nu', 0.30, 'cost', 15.00);

% 
global L;
global H;
global coords
global DOFs
global elements
global fixed_DOFs;
global free_DOFs;
global nodes
global E;
global v;
global penalty;
penalty = 3;
material = materials.Steel;
E = material.E;
v = material.nu;
L = 4; % m
H = 2; % m
P = -100000; % N
t = 0.025; % m
fixed_DOFs = [];
free_DOFs = [];

% Global Declaration
% Mesh Mapping
function map(m, n)
% m = no. of elements along length
% n = no. of elements along height
global L;
global H;
global coords;
global elements;
global nodes;
global DOFs;
lm = L/m;
ln = H/n;
nodes = (m+1) * (n+1);
% Coordinates
coords = zeros(nodes, 2);
counter = 0;
x = 0;
y = 0;
for i = 1:nodes
    if counter == m+1
        x = 0;
        y = y + ln;
        counter = 0;
    end
    coords(i, :) = [x, y];
    x = x + lm;
    counter = counter + 1;
end
% DOFs
DOFs = zeros(nodes, 2);
x = 1;
y = 2;
for i = 1:nodes
    DOFs(i, :) = [x, y];
    x = x + 2;
    y = y + 2;
end
% Elements
counter = 1;
n1 = 1;
n2 = 2;
n1_init = 1;
n2_init = 2;
n_elements = m * n;
elements = zeros(n_elements, 4);
for i = 1:n_elements
    if n1 == (m + 1)*counter
        n1 = n1_init + m+1;
        n2 = n2_init + m+1;
        counter = counter + 1;
        n1_init = n1;
        n2_init = n2;
    end
    if counter == n+1
        break
    end
    elements(i, :) = [n1, n2, n2+m+1, n1+m+1];
    n1 = n1 + 1;
    n2 = n2 + 1;
end
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceColor', 'none', 'EdgeColor', 'k', 'LineWidth', 0.5);
grid on;
box on;
axis equal;
hold on;
end
map(40, 20)

% H Matrix
radius = 0.2; % m, double the element size. Tried 0.3 first but got lower cost with 0.2
centers = zeros(size(elements, 1), 2);
for i = 1:size(elements, 1)
    centers(i, :) = sum(coords(elements(i, :), :), 1) / 4;
end
H = sparse(size(elements, 1), size(elements, 1));

for i = 1:size(elements, 1)
    for j = 1:size(elements, 1)
        dij = norm(centers(i, :) - centers(j, :));
        H(i, j) = max(0, radius - dij);
    end
end
% Normalizing to get a weighted average
for i = 1:size(elements, 1)
    H(i, :) = H(i, :)/sum(H(i, :));
end

% Functions for Stiffness Matrix
function N = N_func(e, n)
    N1 = 0.25 *(1-e)*(1-n);
    N2 = 0.25 *(1+e)*(1-n);
    N3 = 0.25 *(1+e)*(1+n);
    N4 = 0.25 *(1-e)*(1+n);
    N = [N1, N2, N3, N4];
end

function J = Jacobian(e, n, coords)
    % coords matrix is a 4 X 2 matrix
    J = 0.25*[-(1-n) 1-n 1+n -1-n; -1+e -1-e 1+e 1-e]*coords;
end

function B = B_matrix(e, n, J)
    % Format is delN1/dele, delN2/dele, delN3/dele, delN4/dele, ...
    dNde = 0.25*[n-1, 1-n, 1+n, -n-1];
    dNdn = 0.25*[e-1, -e-1, 1+e, 1-e];
    Jinv = inv(J);
    dN = Jinv * [dNde; dNdn];
    B = zeros(3, 8);
    for i=1:4
        B(:, 2*i-1) = [dN(1, i); 0; dN(2, i)];
        B(:, 2*i) = [0; dN(2, i); dN(1, i)];
    end
end

function C = C_matrix()
    global E;
    global v;
    C = E/(1-v^2) * [1 v 0; v 1 0; 0 0 (1-v)/2];
end

function [points, weights] = leggauss(n) % Function made to generalize Gauss Points and Weights
    k = (1:n-1)';
    beta = k ./ sqrt(4*k.^2 - 1);

    J = diag(zeros(n,1)) + diag(beta,1) + diag(beta,-1);
    [V, D] = eig(J);

    [points, idx] = sort(diag(D));
    weights = 2 * (V(1,idx).^2)';
end

function Ke = Ke_func(n_points, element_no, t)
    global elements;
    global coords;
    [points, weights] = leggauss(n_points);
    nodes = elements(element_no, :);
    coordinates = zeros(4, 2);
    for i = 1:numel(nodes)
        coordinates(i,:) = coords(nodes(i), :);
    end
    Ke = zeros(8, 8);
    for i = 1: n_points
        for j = 1:n_points
            N = N_func(points(i), points(j));
            J = Jacobian(points(i), points(j), coordinates);
            C = C_matrix();
            B = B_matrix(points(i), points(j), J);
            detJ = det(J);
            Ke = Ke + t*(weights(i)*weights(j)*B'*C*B*detJ);
        end
    end
end

function K = assemble(t, rho)
    global elements;  
    global DOFs;
    global penalty;
    K = sparse(size(DOFs, 1)*2, size(DOFs, 1)*2); % sparse instead of zeros so that the 0 entries aren't stored
    for i = 1:size(elements, 1)
        Ke = Ke_func(2, i, t)*rho(i)^penalty;
        row = [];
        element = elements(i, :);
        for j=1:numel(element)
            DOF = DOFs(element(j), :);
            row = [row, DOF];
        end
        column = row;
        K(row, column) = K(row, column) + Ke;
    end
end
function p = load_func(x, y, P)
    % x is the position the load is applied at
    % P is the load applied
    % From the coords vector, we know this lands at the 3rd node (6th DOF)
    global DOFs;
    global coords;
    p = zeros(size(DOFs, 1)*2, 1);
    tol = 1e-9;
    node = find(abs(coords(:, 1) - x) < tol & abs(coords(:, 2)-y) < tol);
    p(DOFs(node, 2)) = P;
end

function plot_deformed(u)
    global DOFs;
    global L;
    global coords;
    global elements;
    ux = DOFs(:, 1);
    uy = DOFs(:, 2);
    node_disp = [u(ux), u(uy)];
    % Scale maximum displacement to 10% of horizontal span
    span = L;
    scale = 1;
    max_disp = max(sqrt(sum(node_disp.^2, 2)));
    if max_disp > 0
        scale = 0.1 * span / max_disp;
    end
    u_scaled = scale * node_disp;
    deformedNodes = coords + u_scaled;
    patch('Faces', elements, 'Vertices', deformedNodes, ...
      'FaceColor', 'none', 'EdgeColor', 'r', 'LineWidth', 0.5);
    axis equal;
    hold off;
end

function [K, u] = u_func(x, y, P, m, n, t, rho)
    % Undisplaced Beam
    %map(m ,n);
    global elements;
    global DOFs;
    global nodes;
    global coords;
    global fixed_DOFs;
    global free_DOFs;
    fixed_DOFs = [];
    free_DOFs = [];
    for i = 1:nodes
        if coords(i, 1) == 0        
            fixed_DOFs = [fixed_DOFs DOFs(i, 1) DOFs(i, 2)];
        end
    end
    free_DOFs = setdiff(1:size(DOFs, 1)*2, fixed_DOFs);
    % Displacement of restrained nodes is 0
    K = assemble(t, rho);
    Kg = K(free_DOFs, free_DOFs);
    p = load_func(x, y, P);
    pg = p(free_DOFs);
    u_displaced = Kg\pg;
    u = zeros(size(DOFs, 1)*2, 1);
    u(free_DOFs) = u_displaced;
    % Plot the computed displacement field
    %plot_deformed(u);
end
rho_o = ones(size(elements, 1), 1);
[K, u] = u_func(4, 1, P, 40, 80, t, rho_o);
x = 4;
y = 1;
tol = 1e-9;
node = find(abs(coords(:, 1) - x) < tol & abs(coords(:, 2)-y) < tol);
% Confirming that the initial displacement must be less than 1 mm as material removal can never satisfy an initially unsatisfied constraint
u_initial = u(DOFs(node, 2))

% Objective Function - Cost of beam
% Design Variables - Density of each element (rho, between 0 and 1)
% Objective function and gradient
n_elements = size(elements, 1);
function [f, gradient_f] = objective(material, rho, t , H)
    global elements;
    global coords;
    Area = 0.0025; % m^2
    % H * rho as H is 800 X 800 whereas rho is 800 X 1
    f = sum(Area * t * material.density * H * rho * material.cost);
    % H trasnpose as derivative gives H and gradient is transpose of  derivative
    gradient_f = Area * t * material.density * material.cost * H' * ones(size(rho));
end

function [c, ceq, grad_c, grad_ceq] = constraint(coords, DOFs, t, rho, P, H)
    global fixed_DOFs;
    global free_DOFs;
    global penalty;
    global elements;
    rho_new = H * rho;
    [K, u] = u_func(4, 1, P, 40, 80, t, rho_new);
    x = 4;
    y = 1;
    tol = 1e-9;
    node = find(abs(coords(:, 1) - x) < tol & abs(coords(:, 2)-y) < tol);
    uy = u(DOFs(node, 2));
    c = -uy-0.001;
    ceq = [];
    delf_dely = zeros(size(DOFs, 1)*2, 1);
    delf_dely(DOFs(node, 2)) = -1;
    delf_dely = delf_dely(free_DOFs);
    delR_dely = K(free_DOFs, free_DOFs);
    adjoint = -(delR_dely'\delf_dely);
    adjoint_global = zeros(size(u));
    adjoint_global(free_DOFs) = adjoint;
    grad_c = zeros(size(elements, 1), 1);
    for i = 1:size(elements, 1)
        element = elements(i, :);
        row = [];
        for j = element
            row = [row DOFs(j, :)];
        end
        u_disp = u(row);
        % This is the derivative with the new densities (after multiplication with H)
        delR_delxi = Ke_func(2, i, t)*penalty*(rho_new(i))^(penalty - 1)*u_disp;
        grad_c(i) = adjoint_global(row)'*delR_delxi;
    end
    % This is chain rule applied. We initially got df/dxi, but xi is rho_new. So, we do d(rho_new)/d(rho) and multply it's transpose to grad_c to get new grad_c
    grad_c = H'*grad_c;
    grad_ceq = [];
end

% Using fmincon with non-linear constraints
objective_wrapper = @(rho) objective(material, rho, t, H);
nonlcon = @(rho) constraint(coords, DOFs, t, rho, P, H);
% To avoid a singular element stiffness matrix, the lowerbound is made to be 0.01
lb = 0.01*ones(size(rho_o));
ub = ones(size(rho_o));
options = optimoptions('fmincon', ...
    'SpecifyObjectiveGradient', true, ...
    'SpecifyConstraintGradient', true, ...
    'Display', 'iter');
[rho_opt, fval] = fmincon(objective_wrapper, rho_o, ...
    [], [], [], [], lb, ub, nonlcon, options);
[c_final, ~] = nonlcon(rho_opt)
fprintf('Downward displacement = %.6f mm\n', ...
    (c_final + 0.001)*1000);
fprintf('Optimized cost = %.4f\n', fval);
% Plotting the structure
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceVertexCData', H*rho_opt, ...
    'FaceColor', 'flat', ...
    'EdgeColor', 'none');

axis equal;
colorbar;
clim([0 1]);
colormap(flipud(gray)); % colormap(gray) usually shows white for high density. So, it is flipped to show black for high density
clim([0 1]);
title('Optimized Material Distribution');
xlabel('x (m)');
ylabel('y (m)');

rho_o = 0.5 *ones(n_elements, 1);
% Using fmincon with non-linear constraints
objective_wrapper = @(rho) objective(material, rho, t, H);
nonlcon = @(rho) constraint(coords, DOFs, t, rho, P, H);
% To avoid a singular element stiffness matrix, the lowerbound is made to be 0.01
lb = 0.01*ones(size(rho_o));
ub = ones(size(rho_o));
options = optimoptions('fmincon', ...
    'SpecifyObjectiveGradient', true, ...
    'SpecifyConstraintGradient', true, ...
    'Display', 'iter');
[rho_opt, fval] = fmincon(objective_wrapper, rho_o, ...
    [], [], [], [], lb, ub, nonlcon, options);
[c_final, ~] = nonlcon(rho_opt)
fprintf('Downward displacement = %.6f mm\n', ...
    (c_final + 0.001)*1000);
fprintf('Optimized cost = %.4f\n', fval);
% Plotting the structure
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceVertexCData', H*rho_opt, ...
    'FaceColor', 'flat', ...
    'EdgeColor', 'none');

axis equal;
colorbar;
clim([0 1]);
colormap(flipud(gray));
clim([0 1]);
title('Optimized Material Distribution');
xlabel('x (m)');
ylabel('y (m)');

rho_o = 0.01 *ones(n_elements, 1);
for i = 1:n_elements
    x = centers(i, 1);
    y = centers(i, 2);
    x_test = 4-4*(y-1)^2;
    if norm(x_test - x) < 0.25 % Limit is arbitrary for the most part
        rho_o(i) = 1;
    end
end

% Initial design
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceVertexCData', H*rho_o, ...
    'FaceColor', 'flat', ...
    'EdgeColor', 'none');

axis equal;
colormap(flipud(gray));
clim([0 1]);
colorbar;
xlabel('x(m)');
ylabel('y(m)');

% Using fmincon with non-linear constraints
objective_wrapper = @(rho) objective(material, rho, t, H);
nonlcon = @(rho) constraint(coords, DOFs, t, rho, P, H);
% To avoid a singular element stiffness matrix, the lowerbound is made to be 0.01
lb = 0.01*ones(size(rho_o));
ub = ones(size(rho_o));
options = optimoptions('fmincon', ...
    'SpecifyObjectiveGradient', true, ...
    'SpecifyConstraintGradient', true, ...
    'Display', 'iter');
[rho_opt, fval] = fmincon(objective_wrapper, rho_o, ...
    [], [], [], [], lb, ub, nonlcon, options);
[c_final, ~] = nonlcon(rho_opt)
fprintf('Downward displacement = %.6f mm\n', ...
    (c_final + 0.001)*1000);
fprintf('Optimized cost = %.4f\n', fval);
% Plotting the structure
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceVertexCData', H*rho_opt, ...
    'FaceColor', 'flat', ...
    'EdgeColor', 'none');

axis equal;
colorbar;
clim([0 1]);
colormap(flipud(gray));
clim([0 1]);
title('Optimized Material Distribution');
xlabel('x (m)');
ylabel('y (m)');

rho_o = 0.01 *ones(n_elements, 1);
for i = 1:n_elements
    x = centers(i, 1);
    y = centers(i, 2);
    y_test_top = 2 - x/4;
    y_test_bottom = x/4;
    if norm(y_test_bottom - y) < 0.2 || norm(y_test_top - y) < 0.25 % Limit is arbitrary for the most part
        rho_o(i) = 1;
    end
end

% Initial design
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceVertexCData', H*rho_o, ...
    'FaceColor', 'flat', ...
    'EdgeColor', 'none');

axis equal;
colormap(flipud(gray));
clim([0 1]);
colorbar;
xlabel('x(m)');
ylabel('y(m)');

% Using fmincon with non-linear constraints
objective_wrapper = @(rho) objective(material, rho, t, H);
nonlcon = @(rho) constraint(coords, DOFs, t, rho, P, H);
% To avoid a singular element stiffness matrix, the lowerbound is made to be 0.01
lb = 0.01*ones(size(rho_o));
ub = ones(size(rho_o));
options = optimoptions('fmincon', ...
    'SpecifyObjectiveGradient', true, ...
    'SpecifyConstraintGradient', true, ...
    'Display', 'iter');
[rho_opt, fval] = fmincon(objective_wrapper, rho_o, ...
    [], [], [], [], lb, ub, nonlcon, options);
[c_final, ~] = nonlcon(rho_opt)
fprintf('Downward displacement = %.6f mm\n', ...
    (c_final + 0.001)*1000);
fprintf('Optimized cost = %.4f\n', fval);
% Plotting the structure
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceVertexCData', H*rho_opt, ...
    'FaceColor', 'flat', ...
    'EdgeColor', 'none');

axis equal;
colorbar;
clim([0 1]);
colormap(flipud(gray));
clim([0 1]);
title('Optimized Material Distribution');
xlabel('x (m)');
ylabel('y (m)');

rho_o = rho_opt;
% Initial design
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceVertexCData', H*rho_o, ...
    'FaceColor', 'flat', ...
    'EdgeColor', 'none');

axis equal;
colormap(flipud(gray));
clim([0 1]);
colorbar;
title('Previous Rho (Already Optimized)');
xlabel('x(m)');
ylabel('y(m)');

% Using fmincon with non-linear constraints
objective_wrapper = @(rho) objective(material, rho, t, H);
nonlcon = @(rho) constraint(coords, DOFs, t, rho, P, H);
% To avoid a singular element stiffness matrix, the lowerbound is made to be 0.01
lb = 0.01*ones(size(rho_o));
ub = ones(size(rho_o));
options = optimoptions('fmincon', ...
    'SpecifyObjectiveGradient', true, ...
    'SpecifyConstraintGradient', true, ...
    'Display', 'iter');
[rho_opt, fval] = fmincon(objective_wrapper, rho_o, ...
    [], [], [], [], lb, ub, nonlcon, options);
[c_final, ~] = nonlcon(rho_opt)
fprintf('Downward displacement = %.6f mm\n', ...
    (c_final + 0.001)*1000);
fprintf('Optimized cost = %.4f\n', fval);
% Plotting the structure
figure;
patch('Faces', elements, 'Vertices', coords, ...
    'FaceVertexCData', H*rho_opt, ...
    'FaceColor', 'flat', ...
    'EdgeColor', 'none');

axis equal;
colorbar;
clim([0 1]);
colormap(flipud(gray));
clim([0 1]);
title('Optimized Material Distribution');
xlabel('x (m)');
ylabel('y (m)');