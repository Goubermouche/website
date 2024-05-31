# CUDA Architecture
## Introduction
`Compute` Unified Device Architecture (**CUDA**) is a [proprietary](https://cs.wikipedia.org/wiki/Wikipedie) parallel computing platform and application programming interface (API) that allows software to use certain types of graphics processing units (GPUs) for accelerated general-purpose processing, an approach called general-purpose computing on GPUs (GPGPU). 
**CUDA** API and its runtime: The **CUDA** API is an extension of the C programming language that adds the ability to specify thread-level parallelism in C and also to specify GPU device specific operations (like moving data between the CPU and the GPU). **CUDA** is a software layer that gives direct access to the GPU's virtual instruction set and parallel 
## Computational elements
`computational` elements for the execution of `compute` [kernels](https://en.wikipedia.org/wiki/Wikipedia). In addition to drivers and runtime kernels, the **CUDA** platform includes compilers, libraries and developer tools to help programmers accelerate their applications. 
```
// Copyright 2024, Gurobi Optimization, LLC

// This example formulates and solves the following simple QP model:
//
//     minimize    x + y + x^2 + x*y + y^2 + y*z + z^2
//     subject to  x + 2 y + 3 z >= 4
//                 x +   y       >= 1
//                 x, y, z non-negative
//
//   The example illustrates the use of dense matrices to store A and Q
//   (and dense vectors for the other relevant data).  We don't recommend
//   that you use dense matrices, but this example may be helpful if you
//   already have your data in this format.

#include "gurobi_c++.h"
using namespace std;

static bool
dense_optimize(GRBEnv* env,
               int     rows,
               int     cols,
               double* c,     /* linear portion of objective function */
               double* Q,     /* quadratic portion of objective function */
               double* A,     /* constraint matrix */
               char*   sense, /* constraint senses */
               double* rhs,   /* RHS vector */
               double* lb,    /* variable lower bounds */
               double* ub,    /* variable upper bounds */
               char*   vtype, /* variable types (continuous, binary, etc.) */
               double* solution,
               double* objvalP)
{
  GRBModel model = GRBModel(*env);
  int i, j;
  bool success = false;

  // Add variables to the model

  GRBVar* vars = model.addVars(lb, ub, NULL, vtype, NULL, cols);

  // Populate A matrix

  for (i = 0; i < rows; i++) {
    GRBLinExpr lhs = 0;
    for (j = 0; j < cols; j++)
      if (A[i*cols+j] != 0)
        lhs += A[i*cols+j]*vars[j];
    model.addConstr(lhs, sense[i], rhs[i]);
  }

  GRBQuadExpr obj = 0;

  for (j = 0; j < cols; j++)
    obj += c[j]*vars[j];
  for (i = 0; i < cols; i++)
    for (j = 0; j < cols; j++)
      if (Q[i*cols+j] != 0)
        obj += Q[i*cols+j]*vars[i]*vars[j];

  model.setObjective(obj);

  model.optimize();

  model.write("dense.lp");

  if (model.get(GRB_IntAttr_Status) == GRB_OPTIMAL) {
    *objvalP = model.get(GRB_DoubleAttr_ObjVal);
    for (i = 0; i < cols; i++)
      solution[i] = vars[i].get(GRB_DoubleAttr_X);
    success = true;
  }

  delete[] vars;

  return success;
}

int
main(int   argc,
     char *argv[])
{
  GRBEnv* env = 0;
  try {
    env = new GRBEnv();
    double c[] = {1, 1, 0};
    double  Q[3][3] = {{1, 1, 0}, {0, 1, 1}, {0, 0, 1}};
    double  A[2][3] = {{1, 2, 3}, {1, 1, 0}};
    char    sense[] = {'>', '>'};
    double  rhs[]   = {4, 1};
    double  lb[]    = {0, 0, 0};
    bool    success;
    double  objval, sol[3];

    success = dense_optimize(env, 2, 3, c, &Q[0][0], &A[0][0], sense, rhs,
                             lb, NULL, NULL, sol, &objval);

    cout << "optimal=" << success << " x: " << sol[0] << " y: " << sol[1] << " z: " << sol[2] << endl;

  } catch(GRBException e) {
    cout << "Error code = " << e.getErrorCode() << endl;
    cout << e.getMessage() << endl;
  } catch(...) {
    cout << "Exception during optimization" << endl;
  }

  delete env;
  return 0;
}
```